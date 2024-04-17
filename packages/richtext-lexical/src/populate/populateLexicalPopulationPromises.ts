import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { RichTextAdapter } from 'payload/types'

import type { PopulationPromise } from '../field/features/types.js'
import type { AdapterProps } from '../types.js'

export type Args = Parameters<
  RichTextAdapter<SerializedEditorState, AdapterProps>['populationPromises']
>[0] & {
  editorPopulationPromises: Map<string, Array<PopulationPromise>>
}

type RecurseRichTextArgs = {
  children: SerializedLexicalNode[]
}

export const recurseRichText = ({
  children,
  context,
  currentDepth = 0,
  depth,
  editorPopulationPromises,
  field,
  fieldPromises,
  findMany,
  flattenLocales,
  overrideAccess = false,
  populationPromises,
  req,
  showHiddenFields,
  siblingDoc,
}: Args & RecurseRichTextArgs): void => {
  if (depth <= 0 || currentDepth > depth) {
    return
  }

  if (Array.isArray(children)) {
    children.forEach((node) => {
      if (editorPopulationPromises?.has(node.type)) {
        for (const promise of editorPopulationPromises.get(node.type)) {
          promise({
            context,
            currentDepth,
            depth,
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

      if ('children' in node && Array.isArray(node?.children) && node?.children?.length) {
        recurseRichText({
          children: node.children as SerializedLexicalNode[],
          context,
          currentDepth,
          depth,
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
        })
      }
    })
  }
}

/**
 * Appends all new populationPromises to the populationPromises prop
 */
export const populateLexicalPopulationPromises = ({
  context,
  currentDepth,
  depth,
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
  recurseRichText({
    children: (siblingDoc[field?.name] as SerializedEditorState)?.root?.children ?? [],
    context,
    currentDepth,
    depth,
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
  })
}
