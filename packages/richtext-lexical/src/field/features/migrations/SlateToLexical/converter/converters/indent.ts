import type { SerializedLexicalNode, SerializedParagraphNode } from 'lexical'

import type { SlateNodeConverter } from '../types'

import { convertSlateNodesToLexical } from '..'

export const SlateIndentConverter: SlateNodeConverter = {
  converter({ converters, slateNode }) {
    console.log('slateToLexical > IndentConverter > converter', JSON.stringify(slateNode, null, 2))
    const convertChildren = (node: any, indentLevel: number = 0): SerializedLexicalNode => {
      if (
        (node?.type && (!node.children || node.type !== 'indent')) ||
        (!node?.type && node?.text)
      ) {
        console.log(
          'slateToLexical > IndentConverter > convertChildren > node',
          JSON.stringify(node, null, 2),
        )
        console.log(
          'slateToLexical > IndentConverter > convertChildren > nodeOutput',
          JSON.stringify(
            convertSlateNodesToLexical({
              canContainParagraphs: false,
              converters,
              parentNodeType: 'indent',
              slateNodes: [node],
            }),

            null,
            2,
          ),
        )

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
      console.log('slateToLexical > IndentConverter > children', JSON.stringify(children, null, 2))
      return {
        children: children,
        direction: 'ltr',
        format: '',
        indent: indentLevel,
        type: 'paragraph',
        version: 1,
      } as const as SerializedParagraphNode
    }

    console.log(
      'slateToLexical > IndentConverter > output',
      JSON.stringify(convertChildren(slateNode), null, 2),
    )

    return convertChildren(slateNode)
  },
  nodeTypes: ['indent'],
}
