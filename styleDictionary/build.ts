import Bun from "bun";
import StyleDictionary from "style-dictionary";
import { logVerbosityLevels } from "style-dictionary/enums";
import { tailwindFormat } from "./tailwind/tailwindFormat";

StyleDictionary.registerTransform({
  type: `value`,
  transitive: true,
  name: `figma/colorToScaledRgbaString`,
  filter: (token) => {
    return (
      token.type === "color" &&
      token.value.hasOwnProperty("r") &&
      token.value.hasOwnProperty("g") &&
      token.value.hasOwnProperty("b") &&
      token.value.hasOwnProperty("a")
    );
  },
  transform: (token) => {
    // token.value will be resolved and transformed at this point
    return `rgba(${Math.round(token.value.r * 255)}, ${Math.round(token.value.g * 255)}, ${Math.round(token.value.b * 255)}, ${token.value.a})`;
  },
});


StyleDictionary.registerTransform({
  type: `value`,
  transitive: true,
  name: `value/refToCSSVariable`,
  filter: (token) => {
    return typeof token.value === "string" && token.value.startsWith("ref_");
  },
  transform: (token) => {
    return `var(--${token.value.replace("ref_", "").replace(/\//g, "-")})`;
  },
});

StyleDictionary.registerTransform({
  type: `value`,
  transitive: true,
  name: `value/referenceToPrimitive`,
  filter: (token) => {
    return token.attributes.type !== "primitive";
  },
  transform: (token) => {
    console.log(token);

    return `ref_${token.name.replace(/\//g, "-")}`;
  },
});

StyleDictionary.registerTransform({
  type: `name`,
  transitive: true,
  name: `name/kebabWithoutThemeName`,
  transform: (token) => {
    return token.path.slice(1).join("-");
  },
});


StyleDictionary.registerFormat(tailwindFormat);



Bun.file("config.json")
  .json()
  .then((config) => {
    new StyleDictionary({
      log: {
        verbosity: logVerbosityLevels.verbose,
      },
      source: ["tokens/all-tokens.json"],
      platforms: {
        cssPrimitives: {
          buildPath: "dist/css/",
          transforms: ["figma/colorToScaledRgbaString", "name/kebabWithoutThemeName"],
          options: {
            showFileHeader: false,
          },
          files: [
            {
              filter: (token) => {
                return token.attributes.type === "primitive";
              },
              destination: "primitives.css",
              options: {
                selector: ".primitives",
              },
              format: "css/variables",
            },
          ],
        },
        // tailwindConfig: {
        //   buildPath: "dist/tailwind/",
        //   transforms: ["value/valueToRef"],
        //   files: [
        //     {
        //       filter: (token) => {
        //         return token.attributes.type === "primitive" || token.attributes.type === "utility";
        //       },
        //       destination: "tailwind.config.js",
        //       format: "tailwind",
        //     },
        //   ],
        // },
        cssThemes: {
          buildPath: "dist/css/",
          transforms: ["figma/colorToScaledRgbaString", "name/kebabWithoutThemeName", "value/refToCSSVariable"],
          options: {
            showFileHeader: false,
          },
          files: config.themes.map((theme) => ({
            filter: (token) => {
              return token.attributes.type === "theme" && token.attributes.theme === theme;
            },
            destination: `${theme}.css`,
            options: {
              selector: `.${theme}`,
            },
            format: "css/variables",
          }),
          ),
        },
      },
    }).buildAllPlatforms();

  })
