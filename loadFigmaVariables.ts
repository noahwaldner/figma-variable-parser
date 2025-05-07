import Bun from "bun";

const fetchFigmaVariables = async (fileKey) => {

  const figmaResponse = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/variables/local`,
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
      },
    }
  ).then((res) => res.json());


  return {
    collections: figmaResponse.meta.variableCollections,
    variables: figmaResponse.meta.variables,
  };
};

const loadFigmaVariablesFromFile = async () => {
  const figmaResponse = await Bun.file(`figma-response.json`).json();
  return {
    collections: figmaResponse.meta.variableCollections,
    variables: figmaResponse.meta.variables,
  };
};



const getComputedVariables = ({ collections, variables }, selectedCollections) => {

  const getVariableValueRecursive = (variableId, modeId) => {
    const variable = variables[variableId];
    if (!variable) {
      return {
        name: null,
        value: null,
      };
    }

    const modeKeys = Object.keys(variable.valuesByMode);

    let variableValue = null;
    if (modeKeys.length === 1) {
      variableValue = variable.valuesByMode[modeKeys[0]];
    } else {
      variableValue = variable.valuesByMode[modeId];
    }



    if (variableValue?.type === "VARIABLE_ALIAS") {
      const aliasedVariable = getVariableValueRecursive(variableValue.id, modeId);
      return {
        name: variable.name,
        value: `ref_${aliasedVariable.name?.toLowerCase()}`,
      }
    }

    const returnObject = {
      name: variable.name,
      value: variableValue,
    };


    return returnObject;
  };

  const modes = Object.keys(collections).reduce((acc, collectionId) => {
    const collection = collections[collectionId];


    collection.modes.forEach((mode) => {
      acc[mode.modeId] = mode.name;
    });
    return acc;
  }, {});

  const assembledVariables = Object.keys(variables).reduce((acc, variableId) => {
    const variable = variables[variableId];

    Object.keys(variable.valuesByMode).forEach((modeId) => {
      if (selectedCollections.includes(variable.variableCollectionId)) {
        acc.push({
          name: variable.name.toLowerCase(),
          collection: collections[variable.variableCollectionId].name.replace(" ", "-").toLowerCase(),
          type: variable.resolvedType.toLowerCase(),
          mode: modes[modeId].toLowerCase(),
          value: getVariableValueRecursive(variableId, modeId).value,
        });
      }
    });
    return acc;
  }, []);

  return assembledVariables;
};

// format the collections to be human readable and iterable
const formatCollections = (variables) => {

  const formattedCollections = variables.reduce((acc, variable) => {
    const nameParts = variable.name.split("/");
    let currentLevel = acc;

    // Ensure mode level exists
    currentLevel[variable.mode] = currentLevel[variable.mode] || {};
    currentLevel = currentLevel[variable.mode];

    // Ensure collection level exists
    currentLevel[variable.collection] = currentLevel[variable.collection] || {};
    currentLevel = currentLevel[variable.collection];

    nameParts.forEach((part, index) => {
      const sanitizedPart = part.replace(/ /g, "-");
      if (index === nameParts.length - 1) {
        currentLevel[sanitizedPart] = {
          value: variable.value,
          name: variable.name,
        };
      } else {
        currentLevel[sanitizedPart] = currentLevel[sanitizedPart] || {};
        currentLevel = currentLevel[sanitizedPart];
      }
    });
    return acc;
  }, {});

  return formattedCollections;
};

const saveTokenFiles = (data) => {
  const outputMap = {
    shared: [],
    themes: {

    }
  }
  Object.keys(data).forEach((mode) => {
    Object.keys(data[mode]).forEach((collection) => {
      const fileName = `tokens/${mode}/${collection}.json`
      if (mode == "default") {
        outputMap.shared.push({
          name: collection,
          theme: "default",
          source: fileName
        })
      } else {
        outputMap.themes[mode] = outputMap.themes[mode] || [];
        outputMap.themes[mode].push({
          name: collection,
          theme: mode,
          source: fileName
        })
      }
      Bun.write(fileName, JSON.stringify(data[mode][collection], null, 2));
    });
  });
  Bun.write("token-map.json", JSON.stringify(outputMap, null, 2));
}

fetchFigmaVariables("YusQBIqf7U9QnI8xmTLlqf").then((figmaData) => {
  const computedVariables = getComputedVariables(figmaData, ["VariableCollectionId:80:1510", "VariableCollectionId:80:1513", "VariableCollectionId:419:1502"]);
  const data = formatCollections(computedVariables);
  saveTokenFiles(data);
});
