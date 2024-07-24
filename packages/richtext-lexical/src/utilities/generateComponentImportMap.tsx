import type { RichTextAdapter } from 'payload'

import type { ResolvedServerFeatureMap } from '../features/typesServer.js'

export const getGenerateImportComponentMap =
  (args: {
    resolvedFeatureMap: ResolvedServerFeatureMap
  }): RichTextAdapter['generateComponentImportMap'] =>
  ({ addToComponentImportMap, baseDir, componentMap, config, importMap }) => {
    addToComponentImportMap('@payloadcms/richtext-lexical/client#RichTextCell')
    addToComponentImportMap('@payloadcms/richtext-lexical/client#RichTextField')

    // iterate just through args.resolvedFeatureMap.values()
    for (const resolvedFeature of args.resolvedFeatureMap.values()) {
      if (
        'generateComponentMap' in resolvedFeature &&
        typeof resolvedFeature.generateComponentMap === 'function'
      ) {
        resolvedFeature.generateComponentImportMap({
          addToComponentImportMap,
          baseDir,
          componentMap,
          config,
          importMap,
        })
      }

      const ClientComponent = resolvedFeature.ClientFeature
      if (ClientComponent) {
        addToComponentImportMap(ClientComponent)
      }
    }
  }
