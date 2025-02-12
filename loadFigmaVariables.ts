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

const computeCollections = ({ collections, variables }) => {
  const collectionIds = Object.keys(collections);
  // Generate collections object shape
  const computedCollections = collectionIds.reduce(
    (accumulator, collectionIdentifier) => {
      const collection = collections[collectionIdentifier];
      accumulator[collectionIdentifier] = {
        id: collection.id,
        name: collection.name,
        modes: collection.modes.reduce((acc, current) => {
          acc[current.modeId] = {
            name: current.name,
            variables: [],
          };
          return acc;
        }, {}),
      };
      return accumulator;
    },
    {}
  );

  // Iterate over variables and put them into the collections object
  Object.keys(variables).forEach((variableId) => {
    const variable = variables[variableId];
    Object.keys(variable.valuesByMode).forEach((modeId) => {
      const variableValue = variable.valuesByMode[modeId];
      computedCollections[variable.variableCollectionId].modes[
        modeId
      ].variables.push({
        name: variable.name,
        type: variable.resolvedType,
        value:
          variableValue.type === "VARIABLE_ALIAS"
            ? variables[variableValue.id]?.valuesByMode[modeId]
            : variableValue,
      });
    });
  });

  return computedCollections;
};

// format the collections to be human readable and iterable
const formatCollections = (collections, selectedCollections) => {
  const collectionKeys = Object.keys(collections);
  const formattedCollections = [];
  collectionKeys.forEach((collectionKey) => {
    const collection = collections[collectionKey];
    const collectionModeIds = Object.keys(collection.modes);
    if (selectedCollections.includes(collection.name)) {
      formattedCollections.push({
        id: collection.id,
        name: collection.name,
        modes: collectionModeIds.map((modeId) => collection.modes[modeId]),
      });
    }
  });
  return formattedCollections;
};

loadFimaVariables("YusQBIqf7U9QnI8xmTLlqf").then((figmaData) => {
  const computedCollections = computeCollections(figmaData);
  const data = formatCollections(computedCollections, ["Primitive"]);
  console.dir(data, { depth: null });
});
