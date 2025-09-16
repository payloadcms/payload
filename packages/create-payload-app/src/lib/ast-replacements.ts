export type PluginPackageName = '@payloadcms/plugin-search'
export const pluginReplacements: Record<
  PluginPackageName,
  {
    /** Module used in import statement */
    importModule: string
    /** Named import used in import statement */
    importName: string
    /** Package to be added to the package.json */
    packageName: string
    /** Code to be added to the plugins array */
    pluginCode: string[]
  }
> = {
  '@payloadcms/plugin-search': {
    importModule: '@payloadcms/plugin-search',
    importName: 'searchPlugin',
    packageName: '@payloadcms/plugin-search',
    pluginCode: ['searchPlugin()'],
  },
}
