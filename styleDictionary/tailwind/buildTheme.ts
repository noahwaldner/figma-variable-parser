/* (c) Copyright Frontify Ltd., all rights reserved. */

import { type Dictionary, type TransformedToken } from 'style-dictionary';


const trimHyphens = (value: string): string => {
    return value.replace(/^-+/, '').replace(/-+$/, '');
};

const getOutline = ({ dictionary }: { dictionary: Dictionary }) => {
    return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        violet: `1px solid var(--${dictionary.tokens.focus?.['ring-color'].name})`,
    };
};


const getFontSize = ({ tokens }: { tokens: TransformedToken[] }) => {
    const matchingTokens = tokens.filter(
        (token) =>
            token.attributes?.category === 'size' &&
            token.attributes.type &&
            ['font', 'lineHeight'].includes(token.attributes.type),
    );

    const dictionary = matchingTokens.reduce((acc, cur) => {
        const slug = cur.name.replace('-line-height', '');
        return {
            ...acc,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            [slug]: {
                // @ts-expect-error Old untyped code
                ...acc[slug],
                [cur.name]: cur,
            },
        };
    }, {});

    const list = Object.keys(dictionary).map((key) => {
        const slug = key.replace('size-', '');
        return {
            // @ts-expect-error Old untyped code
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            [slug]: [`var(--${dictionary[key][key].name})`, `var(--${dictionary[key][`${key}-line-height`].name})`],
        };
    });

    const fonts = list.reduce((acc, cur) => {
        return { ...acc, ...cur };
    }, {});

    return fonts;
};

const getObject = ({ tokens, identifier, filter }: { tokens: TransformedToken[], identifier: string[], filter?: (token: TransformedToken) => boolean }) => {

    const matchingTokens = tokens?.filter(
        (token) =>
            identifier.every((idSegment, index) => token.path[index] === idSegment) &&
            (filter ? filter(token) : true),
    ) || [];

    console.log(matchingTokens);




    return matchingTokens.reduce((acc, token) => {
        const path = token.path.slice(identifier.length);
        let currentLevel = acc;
        path.forEach((segment, index) => {
            if (index === path.length - 1) {
                currentLevel[segment] = token.value;
            } else if (segment !== path[index + 1]) {
                currentLevel[segment] = currentLevel[segment] || {};
                currentLevel = currentLevel[segment];
            }
        });

        return acc;
    }, {});
};

const getBoxShadow = ({ tokens, dictionary }: { tokens: TransformedToken[]; dictionary: Dictionary }) => {
    const matchingTokens = tokens.filter(
        (token) => token.attributes?.category === 'shadow' && token.attributes.type === 'matrix',
    );

    const boxShadowObject = {};

    for (const token of matchingTokens) {
        const key = trimHyphens(token.name.replace('shadow', ''));
        boxShadowObject[key || 'DEFAULT'] = `var(--${token.name})`;
    }

    // Object.assign(boxShadowObject, {
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //     'inner-line': `inset 0 0 0 var(--${dictionary.tokens.line?.width.name}) var(--${dictionary.tokens.line?.color.name})`,
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //     'inner-line-strong': `inset 0 0 0 var(--${dictionary.tokens.line?.width.name}) var(--${dictionary.tokens.line?.['color-strong'].name})`,
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //     'inner-line-x-strong': `inset 0 0 0 var(--${dictionary.tokens.line?.width.name}) var(--${dictionary.tokens.line?.['color-x-strong'].name})`,
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //     'inner-line-xx-strong': `inset 0 0 0 var(--${dictionary.tokens.line?.width.name}) var(--${dictionary.tokens.line?.['color-xx-strong'].name})`,
    // });

    return boxShadowObject;
};

const getTheme = (dictionary: Dictionary) => {
    const tokens = dictionary.allTokens;

    return {
        colors: getObject({
            tokens,
            identifier: ['color'],
            filter: (token) => {
                return !token.filePath.includes("primitive");
            },
        }),
        extend: {
            fontSize: getObject({
                identifier: ['typography', 'font-size'],
                tokens: tokens,
            }),

            fontWeight: getObject({
                identifier: ['typography', 'font-weight'],
                tokens: tokens,
            }),

            fontFamily: getObject({
                identifier: ['typography', 'font-family'],
                tokens: tokens,
            }),

            letterSpacing: getObject({
                identifier: ['typography', 'letter-spacing'],
                tokens: tokens,
            }),

            lineHeight: getObject({
                identifier: ['typography', 'line-height'],
                tokens: tokens,
            }),

            // boxShadow: getBoxShadow({
            //     tokens,
            //     dictionary,
            // }),

            // borderWidth: getObject({
            //     identifier: ['line-width'],
            //     tokens,
            // }),

            borderRadius: getObject({
                identifier: ['border-radius'],
                tokens,
                // filter: (token) => token.attributes?.category === 'size' && token.attributes.type === 'borderRadius',
            }),

            // ringColor: getObject({
            //     identifier: ['border-radius'],
            //     tokens,
            //     // filter: (token) => token.attributes?.category === 'size' && token.attributes.type === 'borderRadius',
            // }),

            // outline: getOutline({ dictionary }),

            spacing: getObject({
                identifier: ['spacing'],
                tokens,
            }),
        },
    };
};

export const buildTheme = ({ dictionary }: { dictionary: Dictionary }): Record<string, unknown> => {
    return getTheme(dictionary);
};
