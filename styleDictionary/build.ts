import Bun from "bun";
import StyleDictionary from "style-dictionary";
import { tailwindFormat } from "./tailwind/tailwindFormat";

StyleDictionary.registerTransform({
  type: `value`,
  transitive: true,
  name: `color/figmaToScaledRgbaString`,
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
    return `rgba(${Math.round(token.value.r * 255)}, ${Math.round(token.value.g * 255)}, ${Math.round(token.value.b * 255)}, ${token.value.a})`;
  },
});

StyleDictionary.registerTransform({
  type: `value`,
  transitive: true,
  name: `value/refToString`,
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
  name: `value/valueToRef`,
  filter: (token) => {
    return typeof token.value !== "string" || !token.value.startsWith("ref_");
  },
  transform: (token) => {
    return `ref_${token.name.replace(/\//g, "-")}`;
  },
});

StyleDictionary.registerFormat(tailwindFormat);

StyleDictionary.registerTransformGroup({
  name: "css",
  transforms: [
    "attribute/cti",
    "color/figmaToScaledRgbaString",
    "name/kebab",
    "value/refToString",
  ],
});


Bun.file("token-map.json")
  .json()
  .then((tokenMap) => {
    new StyleDictionary({
      source: tokenMap.shared.map((token) => `${token.source}`),
      platforms: {
        css: {
          buildPath: "dist/css/",
          transformGroup: "css",
          options: {
            showFileHeader: false,
          },
          files: [
            {
              filter: (token) => {
                return token.filePath.startsWith("tokens/default/");
              },
              destination: "primitives.css",
              options: {
                selector: ".primitives",
              },
              format: "css/variables",
            },
          ],
        },
      },
    }).buildAllPlatforms();

    new StyleDictionary({
      source: ["tokens/**/*.json"],
      platforms: {
        tailwind: {
          buildPath: "dist/tailwind/",
          transforms: ["value/valueToRef"],
          files: [
            {
              destination: "tailwind.config.js",
              format: "tailwind",
            },
          ],
        },
      },
    }).buildAllPlatforms();

    Object.keys(tokenMap.themes).forEach((theme) => {
      new StyleDictionary({
        source: tokenMap.themes[theme].map((token) => `${token.source}`),
        platforms: {
          css: {
            buildPath: "dist/css/",
            transformGroup: "css",
            options: {
              showFileHeader: false,
            },
            files: [
              {
                filter: (token) => {
                  return token.filePath.startsWith(`tokens/${theme}/`);
                },
                destination: `${theme}.css`,
                options: {
                  selector: `.${theme}`,
                },
                format: "css/variables",
              },
            ],
          },
        },
      }).buildAllPlatforms();
    });
  })
