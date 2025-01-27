import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { PayloadRequest, RichTextAdapter, RichTextField } from 'payload/types'

import type { PopulationPromise } from '../field/features/types'
import type { AdapterProps } from '../types'

export type Args = Parameters<
  RichTextAdapter<SerializedEditorState, AdapterProps>['populationPromise']
>[0] & {
  editorPopulationPromises: Map<string, Array<PopulationPromise>>
}

type RecurseRichTextArgs = {
  children: SerializedLexicalNode[]
  currentDepth: number
  depth: number
  editorPopulationPromises: Map<string, Array<PopulationPromise>>
  field: RichTextField<SerializedEditorState, AdapterProps>
  overrideAccess: boolean
  promises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
  siblingDoc?: Record<string, unknown>
}

export const recurseRichText = ({
  children,
  context,
  currentDepth = 0,
  depth,
  draft,
  editorPopulationPromises,
  field,
  findMany,
  flattenLocales,
  overrideAccess = false,
  populationPromises,
  promises,
  req,
  showHiddenFields,
  siblingDoc,
}: RecurseRichTextArgs & Args): void => {
  if (depth <= 0 || currentDepth > depth) {
    return
  }

  if (Array.isArray(children)) {
    children.forEach((node) => {
      if (editorPopulationPromises?.has(node.type)) {
        for (const promise of editorPopulationPromises.get(node.type)) {
          promises.push(
            ...promise({
              context,
              currentDepth,
              depth,
              draft,
              editorPopulationPromises,
              field,
              findMany,
              flattenLocales,
              node,
              overrideAccess,
              populationPromises,
              req,
              showHiddenFields,
              siblingDoc,
            }),
          )
        }
      }

      if ('children' in node && Array.isArray(node?.children) && node?.children?.length) {
        recurseRichText({
          children: node.children as SerializedLexicalNode[],
          context,
          currentDepth,
          depth,
          draft,
          editorPopulationPromises,
          field,
          findMany,
          flattenLocales,
          overrideAccess,
          populationPromises,
          promises,
          req,
          showHiddenFields,
          siblingDoc,
        })
      }
    })
  }
}

export const richTextRelationshipPromise = async ({
  context,
  currentDepth,
  depth,
  draft,
  editorPopulationPromises,
  field,
  findMany,
  flattenLocales,
  overrideAccess,
  populationPromises,
  req,
  showHiddenFields,
  siblingDoc,
}: Args): Promise<void> => {
  const promises = []

  recurseRichText({
    children: (siblingDoc[field?.name] as SerializedEditorState)?.root?.children ?? [],
    context,
    currentDepth,
    depth,
    draft,
    editorPopulationPromises,
    field,
    findMany,
    flattenLocales,
    overrideAccess,
    populationPromises,
    promises,
    req,
    showHiddenFields,
    siblingDoc,
  })

  await Promise.all(promises)
}
