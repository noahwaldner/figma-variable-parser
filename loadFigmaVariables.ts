import Bun from "bun";

const loadFimaVariables = async (fileKey) => {
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



const getComputedVariables = ({ collections, variables }) => {

  const getVariableValueRecursive = (variableId, modeId, iteration = 0, parentDebug = null) => {
    const variable = variables[variableId];
    if (!variable) {
      return null;
    }
    if (variable.variableCollectionId == "VariableCollectionId:80:1510") {
      return variable.valuesByMode["80:0"];
    }
    const variableValue = variable.valuesByMode[modeId];
    if (variableValue?.type === "VARIABLE_ALIAS") {
      return getVariableValueRecursive(variableValue.id, modeId, iteration + 1, variables[variableId]);
    }
    return variableValue;
  };

  const modes = Object.keys(collections).reduce((acc, collectionId) => {
    const collection = collections[collectionId];
    if (collection.hiddenFromPublishing) {
      return acc;
    }
    collection.modes.forEach((mode) => {
      acc[mode.modeId] = mode.name;
    });
    return acc;
  }, {});

  const assembledVariables = Object.keys(variables).reduce((acc, variableId) => {
    const variable = variables[variableId];
    Object.keys(variable.valuesByMode).forEach((modeId) => {
      if (variable.hiddenFromPublishing) {
        return acc;
      }
      acc.push({
        name: variable.name.toLowerCase(),
        collection: collections[variable.variableCollectionId].name.toLowerCase(),
        type: variable.resolvedType.toLowerCase(),
        mode: modes[modeId].toLowerCase(),
        value: getVariableValueRecursive(variableId, modeId),
      });
    });
    return acc;
  }, []);

  return assembledVariables;
};

// format the collections to be human readable and iterable
const formatCollections = (variables, selectedCollections) => {

  const formattedCollections = variables.reduce((acc, variable) => {
    if (selectedCollections.includes(variable.collection)) {
      const nameParts = variable.name.split("/");
      let currentLevel = acc;

      // Ensure mode level exists
      currentLevel[variable.mode] = currentLevel[variable.mode] || {};
      currentLevel = currentLevel[variable.mode];

      // Ensure collection level exists
      currentLevel[variable.collection] = currentLevel[variable.collection] || {};
      currentLevel = currentLevel[variable.collection];

      // Ensure type level exists
      currentLevel[variable.type] = currentLevel[variable.type] || {};
      currentLevel = currentLevel[variable.type];

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
    }
    return acc;
  }, {});
  console.log("formattedCollections", formattedCollections);

  return formattedCollections;
};

const saveTokenFiles = (data) => {
  const fileData = [];

  Object.keys(data).forEach((mode) => {
    Object.keys(data[mode]).forEach((collection) => {
      Bun.write(`tokens/${mode}/${collection}.json`, JSON.stringify(data[mode][collection], null, 2));
    });
  });


}

loadFimaVariables("YusQBIqf7U9QnI8xmTLlqf").then((figmaData) => {
  const computedVariables = getComputedVariables(figmaData);
  const data = formatCollections(computedVariables, ["semantic"]);
  saveTokenFiles(data);
});
