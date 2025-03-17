import type { RichTextAdapter } from 'payload'

import { genImportMapIterateFields } from 'payload'

import type { ResolvedServerFeatureMap } from '../features/typesServer.js'

export const getGenerateImportMap =
  (args: { resolvedFeatureMap: ResolvedServerFeatureMap }): RichTextAdapter['generateImportMap'] =>
  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  ({ addToImportMap, baseDir, config, importMap, imports }) => {
    addToImportMap('@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell')
    addToImportMap('@payloadcms/richtext-lexical/rsc#RscEntryLexicalField')
    addToImportMap('@payloadcms/richtext-lexical/rsc#LexicalDiffComponent')

    // iterate just through args.resolvedFeatureMap.values()
    for (const resolvedFeature of args.resolvedFeatureMap.values()) {
      if ('componentImports' in resolvedFeature) {
        if (typeof resolvedFeature.componentImports === 'function') {
          resolvedFeature.componentImports({
            addToImportMap,
            baseDir,
            config,
            importMap,
            imports,
          })
        } else if (
          Array.isArray(resolvedFeature.componentImports) &&
          resolvedFeature.componentImports?.length
        ) {
          resolvedFeature.componentImports.forEach((component) => {
            addToImportMap(component)
          })
        } else if (typeof resolvedFeature.componentImports === 'object') {
          for (const component of Object.values(resolvedFeature.componentImports)) {
            addToImportMap(component)
          }
        }
      }

      const ClientComponent = resolvedFeature.ClientFeature
      if (ClientComponent) {
        addToImportMap(ClientComponent)
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
            genImportMapIterateFields({
              addToImportMap,
              baseDir,
              config,
              fields: subFields,
              importMap,
              imports,
            })
          }
        }
      }
    }
  }
