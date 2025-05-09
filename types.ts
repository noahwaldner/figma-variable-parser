export type Config = {
    defaultTheme: string,
    themes: string[],
    figmaFileKey: string,
    tokenTypes: {
        theme: { collection: string, path?: string[] }[],
        primitive: { collection: string, path?: string[] }[],
        utility: { collection: string, path?: string[] }[]
    }
}
