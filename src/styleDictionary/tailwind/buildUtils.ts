import { type Dictionary, type TransformedToken } from 'style-dictionary';

const getObject = ({ tokens, identifier, filter }: { tokens: TransformedToken[], identifier: string[], filter?: (token: TransformedToken) => boolean }) => {

    const matchingTokens = tokens?.filter(
        (token) =>
            identifier.every((idSegment, index) => token.path[index + 1] === idSegment) &&
            (filter ? filter(token) : true),
    ) || [];

    type NestedObject = {
        [key: string]: NestedObject | string;
    };

    return matchingTokens.reduce<NestedObject>((acc, token) => {

        const path = token.path.slice(identifier.length + 1);
        const property = path[path.length - 1];
        const variant = `'.${path.slice(0, -1).join('-')}'`;

        acc[variant] = acc[variant] || {};
        acc[variant][property] = `"${token.value}"`;

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
            acc += `${propertyKey.replace(/-./g, x => x[1].toUpperCase())}: ${property}`;
            return acc;
        }, '');
        acc += `${variantKey}: { ${properties} }, `;
        return acc;
    }, '');

    return utils;
};

export const buildTextUtil = ({ dictionary }: { dictionary: Dictionary }): string => {
    return `plugin(function({ addUtilities }) {
      addUtilities({
        ${getUtilClasses(dictionary, ['text'])}
      })
    })`
};
