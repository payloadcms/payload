import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { PayloadRequest, RichTextAdapter, RichTextField } from 'payload/types'

import type { PopulationPromise } from '../field/features/types'
import type { AdapterProps } from '../types'

export type Args = Parameters<
  RichTextAdapter<SerializedEditorState, AdapterProps>['populationPromise']
>[0] & {
  populationPromises: Map<string, Array<PopulationPromise>>
}

type RecurseRichTextArgs = {
  children: SerializedLexicalNode[]
  currentDepth: number
  depth: number
  field: RichTextField<SerializedEditorState, AdapterProps>
  overrideAccess: boolean
  populationPromises: Map<string, Array<PopulationPromise>>
  promises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
  siblingDoc?: Record<string, unknown>
}

export const recurseRichText = ({
  children,
  currentDepth = 0,
  depth,
  field,
  overrideAccess = false,
  populationPromises,
  promises,
  req,
  showHiddenFields,
  siblingDoc,
}: RecurseRichTextArgs): void => {
  if (depth <= 0 || currentDepth > depth) {
    return
  }

  if (Array.isArray(children)) {
    children.forEach((node) => {
      if (populationPromises?.has(node.type)) {
        for (const promise of populationPromises.get(node.type)) {
          promises.push(
            ...promise({
              currentDepth,
              depth,
              field,
              node: node,
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
          currentDepth,
          depth,
          field,
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
  currentDepth,
  depth,
  field,
  overrideAccess,
  populationPromises,
  req,
  showHiddenFields,
  siblingDoc,
}: Args): Promise<void> => {
  const promises = []

  recurseRichText({
    children: (siblingDoc[field?.name] as SerializedEditorState)?.root?.children ?? [],
    currentDepth,
    depth,
    field,
    overrideAccess,
    populationPromises,
    promises,
    req,
    showHiddenFields,
    siblingDoc,
  })

  await Promise.all(promises)
}
