import Bun from "bun";
import { loadFigmaVariables } from "./loadFigmaVariables";
import { buildStyleDictionary } from "./styleDictionary/buildStyleDictionary";
import { Config } from "./types";


const buildTokens = async () => {

    const config: Config = await Bun.file("config.json").json()
    await loadFigmaVariables(config);
    await buildStyleDictionary(config);

    let themeStyles = "";
    Promise.all([Bun.file("dist/themes/primitives.css").text().then(content => {
        themeStyles += content + "\n";
    }), ...config.themes.map(async (theme) => {
        return Bun.file(`dist/themes/${theme}.css`).text().then(content => {
            themeStyles += content + "\n";
        });
    })]).then(() => {
        Bun.write("dist/themes/themes.module.css", themeStyles);
    });

    const moduleTypesTemplate = `declare const styles: {
      primitives: string;
      ${config.themes.map(theme => `
      ${theme}: string;`).join("\n")}
    };
    
    export default styles;`

    Bun.write("dist/themes/themes.module.css.d.ts", moduleTypesTemplate);

};


buildTokens();



