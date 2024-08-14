import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { Payload, PayloadRequest } from 'payload'

import { createLocalReq } from 'payload'

import type { HTMLConverter, SerializedLexicalNodeWithParent } from './types.js'

export type ConvertLexicalToHTMLArgs = {
  converters: HTMLConverter[]
  data: SerializedEditorState
  draft?: boolean // default false
  overrideAccess?: boolean // default false
  showHiddenFields?: boolean // default false
} & (
  | {
      /**
       * This payload property will only be used if req is undefined.
       */
      payload?: Payload
      /**
       * When the converter is called, req CAN be passed in depending on where it's run.
       * If this is undefined and config is passed through, lexical will create a new req object for you. If this is null or
       * config is undefined, lexical will not create a new req object for you and local API / server-side-only
       * functionality will be disabled.
       */
      req?: null | undefined
    }
  | {
      /**
       * This payload property will only be used if req is undefined.
       */
      payload?: never
      /**
       * When the converter is called, req CAN be passed in depending on where it's run.
       * If this is undefined and config is passed through, lexical will create a new req object for you. If this is null or
       * config is undefined, lexical will not create a new req object for you and local API / server-side-only
       * functionality will be disabled.
       */
      req: PayloadRequest
    }
)

export async function convertLexicalToHTML({
  converters,
  data,
  draft,
  overrideAccess,
  payload,
  req,
  showHiddenFields,
}: ConvertLexicalToHTMLArgs): Promise<string> {
  if (data?.root?.children?.length) {
    if (req === undefined && payload) {
      req = await createLocalReq({}, payload)
    }

    return await convertLexicalNodesToHTML({
      converters,
      draft: draft === undefined ? false : draft,
      lexicalNodes: data?.root?.children,
      overrideAccess: overrideAccess === undefined ? false : overrideAccess,
      parent: data?.root,
      req,
      showHiddenFields: showHiddenFields === undefined ? false : showHiddenFields,
    })
  }
  return ''
}

export async function convertLexicalNodesToHTML({
  converters,
  draft,
  lexicalNodes,
  overrideAccess,
  parent,
  req,
  showHiddenFields,
}: {
  converters: HTMLConverter[]
  draft: boolean
  lexicalNodes: SerializedLexicalNode[]
  overrideAccess: boolean
  parent: SerializedLexicalNodeWithParent
  /**
   * When the converter is called, req CAN be passed in depending on where it's run.
   */
  req: PayloadRequest | null
  showHiddenFields: boolean
}): Promise<string> {
  const unknownConverter = converters.find((converter) => converter.nodeTypes.includes('unknown'))

  const htmlArray = await Promise.all(
    lexicalNodes.map(async (node, i) => {
      const converterForNode = converters.find((converter) =>
        converter.nodeTypes.includes(node.type),
      )
      try {
        if (!converterForNode) {
          if (unknownConverter) {
            return await unknownConverter.converter({
              childIndex: i,
              converters,
              draft,
              node,
              overrideAccess,
              parent,
              req,
              showHiddenFields,
            })
          }
          return '<span>unknown node</span>'
        }
        return await converterForNode.converter({
          childIndex: i,
          converters,
          draft,
          node,
          overrideAccess,
          parent,
          req,
          showHiddenFields,
        })
      } catch (error) {
        console.error('Error converting lexical node to HTML:', error, 'node:', node)
        return ''
      }
    }),
  )

  return htmlArray.join('') || ''
}
