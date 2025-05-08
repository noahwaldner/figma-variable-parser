import { buildTheme } from "./buildTheme";

export const tailwindFormat = {
  name: "tailwind",
  format: ({ dictionary, options }) => {
    const theme = buildTheme({ dictionary });
    // console.log(dictionary.allTokens);
    console.dir(theme, { depth: null });

    // console.log(formatProperty);
    return "gdskgfdsaukzf";
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
