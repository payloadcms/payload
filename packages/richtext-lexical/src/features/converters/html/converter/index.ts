import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { Payload } from 'payload'

import type { HTMLConverter, SerializedLexicalNodeWithParent } from './types.js'

export async function convertLexicalToHTML({
  converters,
  data,
  payload,
}: {
  converters: HTMLConverter[]
  data: SerializedEditorState
  /**
   * When the converter is called, payload CAN be passed in depending on where it's run.
   */
  payload: Payload | null
}): Promise<string> {
  if (data?.root?.children?.length) {
    return await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: data?.root?.children,
      parent: data?.root,
      payload,
    })
  }
  return ''
}

export async function convertLexicalNodesToHTML({
  converters,
  lexicalNodes,
  parent,
  payload,
}: {
  converters: HTMLConverter[]
  lexicalNodes: SerializedLexicalNode[]
  parent: SerializedLexicalNodeWithParent
  /**
   * When the converter is called, payload CAN be passed in depending on where it's run.
   */
  payload: Payload | null
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
              node,
              parent,
              payload,
            })
          }
          return '<span>unknown node</span>'
        }
        return await converterForNode.converter({
          childIndex: i,
          converters,
          node,
          parent,
          payload,
        })
      } catch (error) {
        console.error('Error converting lexical node to HTML:', error, 'node:', node)
        return ''
      }
    }),
  )

  return htmlArray.join('') || ''
}
