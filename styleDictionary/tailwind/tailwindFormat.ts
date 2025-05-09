import { buildTheme } from "./buildTheme";
import { buildTextUtil } from "./buildUtils";

export const tailwindFormat = {
  name: "tailwind",
  format: ({ dictionary }) => {
    const theme = buildTheme({ dictionary });
    const utils = buildTextUtil({ dictionary });
    return template(theme, utils);
  },
};

const template = (theme, plugins) => {
  return `import plugin from 'tailwindcss/plugin';
  
  export default {
      darkMode: "class",
      prefix: "tw-",
      theme: ${JSON.stringify(theme)},
      plugins: [${plugins}],
  };`;
};
