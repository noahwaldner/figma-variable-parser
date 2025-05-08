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
        const variant = `.${path.slice(0, -1).join('-')}`;

        acc[variant] = acc[variant] || {};
        acc[variant][property] = token.value;

        return acc;
    }, {});
};


const getUtils = (dictionary: Dictionary) => {
    const tokens = dictionary.allTokens

    const textTokens = getObject({
        identifier: ['text'],
        tokens,
    });

    const utils = Object.keys(textTokens).reduce((acc, variantKey) => {
        const variant = textTokens[variantKey];
        const properties = Object.keys(variant).reduce((acc, propertyKey) => {
            const property = variant[propertyKey];
            acc += `${propertyKey}: ${property}`;
            return acc;
        }, '');
        acc += `${variantKey} { ${properties} }`;
        return acc;
    }, '');

    return utils;
};

export const buildUtils = ({ dictionary }: { dictionary: Dictionary }): string => {
    return getUtils(dictionary);
};
