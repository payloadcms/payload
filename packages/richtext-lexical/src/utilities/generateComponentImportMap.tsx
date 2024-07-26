import type { RichTextAdapter } from 'payload'

import { genComponentImportMapIterateFields } from 'payload'

import type { ResolvedServerFeatureMap } from '../features/typesServer.js'

export const getGenerateImportComponentMap =
  (args: {
    resolvedFeatureMap: ResolvedServerFeatureMap
  }): RichTextAdapter['generateComponentImportMap'] =>
  ({ addToComponentImportMap, baseDir, componentMap, config, importMap }) => {
    addToComponentImportMap('@payloadcms/richtext-lexical/client#RichTextCell')
    addToComponentImportMap('@payloadcms/richtext-lexical/client#RichTextField')
    addToComponentImportMap(
      '@payloadcms/richtext-lexical/generateComponentMap#getGenerateComponentMap',
    )

    // iterate just through args.resolvedFeatureMap.values()
    for (const resolvedFeature of args.resolvedFeatureMap.values()) {
      if ('componentImports' in resolvedFeature) {
        if (typeof resolvedFeature.componentImports === 'function') {
          resolvedFeature.componentImports({
            addToComponentImportMap,
            baseDir,
            componentMap,
            config,
            importMap,
          })
        } else if (resolvedFeature.componentImports?.length) {
          resolvedFeature.componentImports.forEach((component) => {
            addToComponentImportMap(component)
          })
        }
      }

      const ClientComponent = resolvedFeature.ClientFeature
      if (ClientComponent) {
        addToComponentImportMap(ClientComponent)
      }

      /*
        Now run for all possible sub-fields
       */
      if (resolvedFeature.nodes?.length) {
        for (const node of resolvedFeature.nodes) {
          if (typeof node?.getSubFields !== 'function') {
            continue
          }
          const subFields = node.getSubFields({})
          if (subFields?.length) {
            genComponentImportMapIterateFields({
              addToComponentImportMap,
              baseDir,
              componentMap,
              config,
              fields: subFields,
              importMap,
            })
          }
        }
      }
    }
  }
