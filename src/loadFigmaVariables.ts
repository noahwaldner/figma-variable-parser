import Bun from "bun";
import { type AssembledVariable, type Config, type FigmaResponse, type FigmaVariableCollections, type FigmaVariables, type FigmaVariableValue } from "./types";

const fetchFigmaVariables = async (fileKey: Config["figmaFileKey"]) => {
  if (!process.env.FIGMA_ACCESS_TOKEN) throw new Error("FIGMA_ACCESS_TOKEN is not set");
  const figmaResponse = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/variables/local`,
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
      },
    }
  ).then((res) => res.json() as Promise<FigmaResponse>);

  return {
    collections: figmaResponse.meta.variableCollections,
    variables: figmaResponse.meta.variables,
  };
};

const getComputedVariables = ({ collections, variables }: { collections: FigmaVariableCollections, variables: FigmaVariables }, config: Config["tokenTypes"]) => {
  const selectedCollections = Object.entries(config).reduce<{ collection: string, path?: string[], tokenType: string }[]>((acc, [tokenType, selector]) => {
    return [...acc, ...selector.map(selector => ({
      ...selector,
      tokenType
    }))];
  }, []);

  const getVariableValueRecursive = (variableId: string, modeId: string): { name: string | null, value: FigmaVariableValue | null } => {
    const variable = variables[variableId];
    if (variable === undefined) {
      return {
        name: null,
        value: null,
      };
    }

    const modeKeys: string[] = Object.keys(variable.valuesByMode);
    let variableValue: FigmaVariableValue | null;
    if (modeKeys.length > 1) {
      variableValue = variable.valuesByMode[modeId] || null;
    } else {
      variableValue = Object.values(variable.valuesByMode)[0] || null;
    }
    if (variableValue && typeof variableValue === 'object' && 'type' in variableValue && variableValue.type === "VARIABLE_ALIAS") {
      return {
        name: variable.name,
        value: `ref_${getVariableValueRecursive(variableValue.id, modeId).name?.toLowerCase()}`,
      }
    }

    return {
      name: variable.name,
      value: variableValue,
    };
  };

  const modes = Object.entries(collections).reduce<Record<string, string>>((acc, [collectionId, collection]) => {
    if (collection) {
      collection.modes.forEach(({ modeId, name }) => {
        acc[modeId] = name;
      });
    }
    return acc;
  }, {});

  const assembledVariables = Object.entries(variables).reduce<AssembledVariable[]>((acc, [variableId, variable]) => {
    Object.keys(variable.valuesByMode).forEach((modeId) => {
      selectedCollections.forEach(({ collection, path, tokenType }) => {
        if (collection == variable.variableCollectionId) {
          const tokenPath = path ? variable.name.split("/") : [];
          if (!path || (path && path.every((segment, index) => tokenPath[index]?.toLowerCase() === segment.toLowerCase()))) {
            acc.push({
              name: variable.name.toLowerCase(),
              type: variable.resolvedType.toLowerCase(),
              value: getVariableValueRecursive(variableId, modeId).value,
              attributes: {
                collection: collections[variable.variableCollectionId]?.name.replace(" ", "-").toLowerCase() || "",
                type: tokenType.toLowerCase(),
                theme: modes[modeId]?.toLowerCase() || "",
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

type NestedAssembledVariable = {
  [key: string]: NestedAssembledVariable | AssembledVariable;
}

// generate a style directory compatible structure
const formatCollections = (variables: AssembledVariable[]) => {
  const formattedCollections = variables.reduce<NestedAssembledVariable>((acc, variable) => {
    const nameParts = variable.name.split("/");
    let currentLevel = acc;

    currentLevel[variable.attributes.theme] = currentLevel[variable.attributes.theme] || {};
    currentLevel = currentLevel[variable.attributes.theme] as NestedAssembledVariable;

    nameParts.forEach((part, index) => {
      const sanitizedPart = part.replace(/ /g, "-");
      if (index === nameParts.length - 1) {
        currentLevel[sanitizedPart] = variable;
      } else {
        currentLevel[sanitizedPart] = currentLevel[sanitizedPart] || {};
        currentLevel = currentLevel[sanitizedPart] as NestedAssembledVariable;
      }
    });
    return acc;
  }, {});

  return formattedCollections;
};


export const loadFigmaVariables = (config: Config) => {
  return fetchFigmaVariables(config.figmaFileKey).then((figmaData) => {
    const computedVariables = getComputedVariables(figmaData, config.tokenTypes);
    const data = formatCollections(computedVariables);
    Bun.write(new URL("../.tmp/tokens/all-tokens.json", import.meta.url), JSON.stringify(data, null, 2));
  });
}


