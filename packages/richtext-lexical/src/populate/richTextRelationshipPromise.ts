import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { PayloadRequest, RichTextAdapter, RichTextField } from 'payload/types'

import type { AfterReadPromise } from '../field/features/types'
import type { AdapterProps } from '../types'

export type Args = Parameters<RichTextAdapter<AdapterProps>['afterReadPromise']>[0] & {
  afterReadPromises: Map<string, Array<AfterReadPromise>>
}

type RecurseRichTextArgs = {
  afterReadPromises: Map<string, Array<AfterReadPromise>>
  children: SerializedLexicalNode[]
  currentDepth: number
  depth: number
  field: RichTextField<AdapterProps>
  overrideAccess: boolean
  promises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
}

export const recurseRichText = ({
  afterReadPromises,
  children,
  currentDepth = 0,
  depth,
  field,
  overrideAccess = false,
  promises,
  req,
  showHiddenFields,
}: RecurseRichTextArgs): void => {
  if (depth <= 0 || currentDepth > depth) {
    return
  }

  if (Array.isArray(children)) {
    children.forEach((node) => {
      if (afterReadPromises?.has(node.type)) {
        for (const promise of afterReadPromises.get(node.type)) {
          promises.push(
            ...promise({
              afterReadPromises,
              currentDepth,
              depth,
              field,
              node: node,
              overrideAccess,
              req,
              showHiddenFields,
            }),
          )
        }
      }

      if ('children' in node && node?.children) {
        recurseRichText({
          afterReadPromises,
          children: node.children as SerializedLexicalNode[],
          currentDepth,
          depth,
          field,
          overrideAccess,
          promises,
          req,
          showHiddenFields,
        })
      }
    })
  }
}

export const richTextRelationshipPromise = async ({
  afterReadPromises,
  currentDepth,
  depth,
  field,
  overrideAccess,
  req,
  showHiddenFields,
  siblingDoc,
}: Args): Promise<void> => {
  const promises = []

  recurseRichText({
    afterReadPromises,
    children: (siblingDoc[field?.name] as SerializedEditorState)?.root?.children ?? [],
    currentDepth,
    depth,
    field,
    overrideAccess,
    promises,
    req,
    showHiddenFields,
  })

  await Promise.all(promises)
}
