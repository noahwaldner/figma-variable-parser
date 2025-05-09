import Bun from "bun";
import { buildStyleDictionary } from "./styleDictionary/build";

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




const getComputedVariables = ({ collections, variables }, config: Config) => {

  const selectedCollections: { collection: string, path?: string[], tokenType: string }[] = Object.entries(config).reduce((acc, [tokenType, selector]) => {
    return [...acc, ...selector.map(selector => ({
      ...selector,
      tokenType
    }))];
  }, []);


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

    return {
      name: variable.name,
      value: variableValue,
    };
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




      selectedCollections.forEach(({ collection, path, tokenType }) => {

        if (collection == variable.variableCollectionId) {

          const tokenPath = path ? variable.name.split("/") : [];
          if (!path || (path && path.every((segment, index) => tokenPath[index].toLowerCase() === segment.toLowerCase()))) {
            acc.push({
              name: variable.name.toLowerCase(),
              type: variable.resolvedType.toLowerCase(),
              value: getVariableValueRecursive(variableId, modeId).value,
              attributes: {
                collection: collections[variable.variableCollectionId].name.replace(" ", "-").toLowerCase(),
                type: tokenType.toLowerCase(),
                theme: modes[modeId].toLowerCase(),
              },

            });
          }
        }
      })
    });
    return acc;
  }, []);

  return assembledVariables;
};


// generate a style directory compatible structure
const formatCollections = (variables) => {
  const formattedCollections = variables.reduce((acc, variable) => {
    const nameParts = variable.name.split("/");
    let currentLevel = acc;

    currentLevel[variable.attributes.theme] = currentLevel[variable.attributes.theme] || {};
    currentLevel = currentLevel[variable.attributes.theme];

    nameParts.forEach((part, index) => {
      const sanitizedPart = part.replace(/ /g, "-");
      if (index === nameParts.length - 1) {
        currentLevel[sanitizedPart] = variable;
      } else {
        currentLevel[sanitizedPart] = currentLevel[sanitizedPart] || {};
        currentLevel = currentLevel[sanitizedPart];
      }
    });
    return acc;
  }, {});

  return formattedCollections;
};


type Config = {
  figmaFileKey: string,
  themes: string[],
  tokenTypes: {
    theme: { collection: string, path?: string[] }[],
    primitive: { collection: string, path?: string[] }[],
    utility: { collection: string, path?: string[] }[]
  }
}


Bun.file("config.json").json().then((config) => {
  fetchFigmaVariables(config.figmaFileKey).then((figmaData) => {
    const computedVariables = getComputedVariables(figmaData, config.tokenTypes);
    const data = formatCollections(computedVariables);
    Bun.write("tokens/all-tokens.json", JSON.stringify(data, null, 2));
    buildStyleDictionary(config);

  });
});


