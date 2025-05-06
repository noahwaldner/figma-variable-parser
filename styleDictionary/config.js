import StyleDictionary from "style-dictionary";
import { tailwindFormat } from "./tailwindFormat.js";

StyleDictionary.registerTransform({
  type: `value`,
  transitive: true,
  name: `color/rgbaToString`,
  filter: (token) => {
    return (
      token.attributes.category === "color" &&
      token.value.hasOwnProperty("r") &&
      token.value.hasOwnProperty("g") &&
      token.value.hasOwnProperty("b") &&
      token.value.hasOwnProperty("a")
    );
  },
  transform: (token) => {
    // token.value will be resolved and transformed at this point
    return `"rgba(${token.value.r}, ${token.value.g}, ${token.value.b}, ${token.value.a})"`;
  },
});

StyleDictionary.registerFormat(tailwindFormat);

StyleDictionary.registerTransformGroup({
  name: "css",
  transforms: ["attribute/cti", "color/rgbaToString", "name/kebab"],
});

export default {
  source: [`tokens/light/**/*.json`],
  platforms: {
    css: {
      buildPath: "dist/css/",
      transformGroup: "css",
      files: [
        {
          destination: "theme.css",
          format: "css/variables",
          options: {
            selector: ".light",
            filter: function (token) {
              return token.filePath.includes("tokens/light/");
            },
          },
        },
      ],
    },
    tailwind: {
      buildPath: "dist/css/",
      transforms: ["attribute/cti", "color/rgbaToString", "name/kebab"],
      files: [
        {
          destination: "tailwind.js",
          format: "tailwind",
        },
      ],
    },
  },
};
