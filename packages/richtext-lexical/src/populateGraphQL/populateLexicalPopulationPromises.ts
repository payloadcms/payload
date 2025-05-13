import type { SerializedEditorState } from 'lexical'
import type { RichTextAdapter } from 'payload'

import type { PopulationPromise } from '../features/typesServer.js'
import type { AdapterProps } from '../types.js'

import { recurseNodes } from '../utilities/forEachNodeRecursively.js'

export type Args = {
  editorPopulationPromises: Map<string, Array<PopulationPromise>>
  parentIsLocalized: boolean
} & Parameters<
  NonNullable<RichTextAdapter<SerializedEditorState, AdapterProps>['graphQLPopulationPromises']>
>[0]

/**
 * Appends all new populationPromises to the populationPromises prop
 */
export const populateLexicalPopulationPromises = ({
  context,
  currentDepth,
  depth,
  draft,
  editorPopulationPromises,
  field,
  fieldPromises,
  findMany,
  flattenLocales,
  overrideAccess,
  parentIsLocalized,
  populationPromises,
  req,
  showHiddenFields,
  siblingDoc,
}: Args) => {
  const shouldPopulate = depth && currentDepth! <= depth

  if (!shouldPopulate) {
    return
  }

  recurseNodes({
    callback: (node) => {
      const editorPopulationPromisesOfNodeType = editorPopulationPromises?.get(node.type)
      if (editorPopulationPromisesOfNodeType) {
        for (const promise of editorPopulationPromisesOfNodeType) {
          promise({
            context,
            currentDepth: currentDepth!,
            depth,
            draft,
            editorPopulationPromises,
            field,
            fieldPromises,
            findMany,
            flattenLocales,
            node,
            overrideAccess: overrideAccess!,
            parentIsLocalized,
            populationPromises,
            req,
            showHiddenFields,
            siblingDoc,
          })
        }
      }
    },

    nodes: (siblingDoc[field?.name] as SerializedEditorState)?.root?.children ?? [],
  })
}
