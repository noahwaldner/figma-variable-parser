import { formattedVariables } from "style-dictionary/utils";

export const tailwindFormat = {
  name: "tailwind",
  format: ({ dictionary, options }) => {
    const formatProperty = formattedVariables({
      outputReferences: options.outputReferences,
      dictionary: dictionary,
      formatting: {},
    });
    // console.log(formatProperty);
    return "";
  },
};

const template = (theme) => {
  // console.log(theme);
  return `import plugin from 'tailwindcss/plugin';
  
  export default {
      darkMode: "class",
      prefix: "tw-",
      theme: ${JSON.stringify(theme)},
  };`;
};
