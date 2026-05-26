import type { RichTextAdapter } from 'payload'

import { genImportMapIterateFields } from 'payload'

import type { ResolvedServerFeatureMap } from '../features/typesServer.js'
import type { LexicalEditorProps } from '../types.js'

export const getGenerateImportMap =
  (args: {
    lexicalEditorArgs?: LexicalEditorProps
    resolvedFeatureMap: ResolvedServerFeatureMap
  }): RichTextAdapter['generateImportMap'] =>
  ({ addToImportMap, baseDir, config, importMap, imports }) => {
    addToImportMap('@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell')
    addToImportMap('@payloadcms/richtext-lexical/rsc#RscEntryLexicalField')
    addToImportMap('@payloadcms/richtext-lexical/rsc#LexicalDiffComponent')

    addToImportMap(args.lexicalEditorArgs?.views)

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
        } else if (Array.isArray(resolvedFeature.componentImports)) {
          addToImportMap(resolvedFeature.componentImports)
        } else if (typeof resolvedFeature.componentImports === 'object') {
          addToImportMap(Object.values(resolvedFeature.componentImports))
        }
      }

      addToImportMap(resolvedFeature.ClientFeature)

      /*
       * Now run for all possible sub-fields
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
