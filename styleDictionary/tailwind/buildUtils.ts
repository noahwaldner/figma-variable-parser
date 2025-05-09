import { type Dictionary, type TransformedToken } from 'style-dictionary';

const getObject = ({ tokens, identifier, filter }: { tokens: TransformedToken[], identifier: string[], filter?: (token: TransformedToken) => boolean }) => {

    const matchingTokens = tokens?.filter(
        (token) =>
            identifier.every((idSegment, index) => token.path[index] === idSegment) &&
            (filter ? filter(token) : true),
    ) || [];

    return matchingTokens.reduce((acc, token) => {

        const path = token.path.slice(identifier.length);
        const property = path[path.length - 1];
        const variant = `'.${path.slice(0, -1).join('-')}'`;

        acc[variant] = acc[variant] || {};
        acc[variant][property] = `theme('${token.value.replace("ref_", "").replace(/\//g, ".")}')`;

        return acc;
    }, {});
};


const getUtilClasses = (dictionary: Dictionary, identifier: string[]) => {
    const tokens = dictionary.allTokens

    const textTokens = getObject({
        identifier,
        tokens,
    });

    const utils = Object.keys(textTokens).reduce((acc, variantKey) => {
        const variant = textTokens[variantKey];
        const properties = Object.keys(variant).reduce((acc, propertyKey) => {
            const property = variant[propertyKey];
            if (acc !== '') {
                acc += `, `;
            }
            acc += `${propertyKey}: ${property}`;
            return acc;
        }, '');
        acc += `${variantKey}: { ${properties} }`;
        return acc;
    }, '');

    return utils;
};

export const buildTextUtil = ({ dictionary }: { dictionary: Dictionary }): string => {
    return `plugin(function({ addUtilities, theme }) {
      addUtilities({
        ${getUtilClasses(dictionary, ['text'])}
      })
    })`
};
