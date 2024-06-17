import type { SerializedEditorState } from 'lexical'
import type { RichTextAdapter } from 'payload'

import type { PopulationPromise } from '../field/features/types.js'
import type { AdapterProps } from '../types.js'

import { recurseNodes } from '../forEachNodeRecursively.js'

export type Args = Parameters<
  RichTextAdapter<SerializedEditorState, AdapterProps>['graphQLPopulationPromises']
>[0] & {
  editorPopulationPromises: Map<string, Array<PopulationPromise>>
}

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
  populationPromises,
  req,
  showHiddenFields,
  siblingDoc,
}: Args) => {
  const shouldPopulate = depth && currentDepth <= depth

  if (!shouldPopulate) {
    return
  }

  recurseNodes({
    callback: (node) => {
      if (editorPopulationPromises?.has(node.type)) {
        for (const promise of editorPopulationPromises.get(node.type)) {
          promise({
            context,
            currentDepth,
            depth,
            draft,
            editorPopulationPromises,
            field,
            fieldPromises,
            findMany,
            flattenLocales,
            node,
            overrideAccess,
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
