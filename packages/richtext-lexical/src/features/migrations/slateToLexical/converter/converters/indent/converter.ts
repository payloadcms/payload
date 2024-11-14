import type { SerializedLexicalNode, SerializedParagraphNode } from 'lexical'

import type { SlateNodeConverter } from '../../types.js'

import { convertSlateNodesToLexical } from '../../index.js'

export const SlateIndentConverter: SlateNodeConverter = {
  converter({ converters, slateNode }) {
    const convertChildren = (node: any, indentLevel: number = 0): SerializedLexicalNode => {
      if (
        (node?.type && (!node.children || node.type !== 'indent')) ||
        (!node?.type && node?.text)
      ) {
        return {
          ...convertSlateNodesToLexical({
            canContainParagraphs: false,
            converters,
            parentNodeType: 'indent',
            slateNodes: [node],
          })[0],
          indent: indentLevel,
        } as const as SerializedLexicalNode
      }

      const children = node.children.map((child: any) => convertChildren(child, indentLevel + 1))
      return {
        type: 'paragraph',
        children,
        direction: 'ltr',
        format: '',
        indent: indentLevel,
        version: 1,
      } as const as SerializedParagraphNode
    }

    return convertChildren(slateNode)
  },
  nodeTypes: ['indent'],
}
