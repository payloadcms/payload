import type {
  SerializedEditorState,
  SerializedLexicalNode,
  SerializedParagraphNode,
  SerializedTextNode,
} from 'lexical'

import type { LexicalPluginNodeConverter, PayloadPluginLexicalData } from './types'

export function convertLexicalPluginToLexical({
  converters,
  lexicalPluginData,
}: {
  converters: LexicalPluginNodeConverter[]
  lexicalPluginData: PayloadPluginLexicalData
}): SerializedEditorState {
  return {
    root: {
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginData?.jsonContent?.root?.children || [],
        parentNodeType: 'root',
      }),
      direction: lexicalPluginData?.jsonContent?.root?.direction || 'ltr',
      format: lexicalPluginData?.jsonContent?.root?.format || '',
      indent: lexicalPluginData?.jsonContent?.root?.indent || 0,
      type: 'root',
      version: 1,
    },
  }
}

export function convertLexicalPluginNodesToLexical({
  converters,
  lexicalPluginNodes,
  parentNodeType,
}: {
  converters: LexicalPluginNodeConverter[]
  lexicalPluginNodes: SerializedLexicalNode[]
  /**
   * Type of the parent lexical node (not the type of the original, parent payload-plugin-lexical type)
   */
  parentNodeType: string
}): SerializedLexicalNode[] {
  const unknownConverter = converters.find((converter) => converter.nodeTypes.includes('unknown'))
  return (
    lexicalPluginNodes.map((lexicalPluginNode, i) => {
      if (lexicalPluginNode.type === 'paragraph') {
        return convertParagraphNode(converters, lexicalPluginNode)
      }
      if (lexicalPluginNode.type === 'text' || !lexicalPluginNode.type) {
        return convertTextNode(lexicalPluginNode)
      }

      const converter = converters.find((converter) =>
        converter.nodeTypes.includes(lexicalPluginNode.type),
      )

      if (converter) {
        return converter.converter({ childIndex: i, converters, lexicalPluginNode, parentNodeType })
      }

      console.warn(
        'lexicalPluginToLexical > No converter found for node type: ' + lexicalPluginNode.type,
      )
      return unknownConverter?.converter({
        childIndex: i,
        converters,
        lexicalPluginNode,
        parentNodeType,
      })
    }) || []
  )
}

export function convertParagraphNode(
  converters: LexicalPluginNodeConverter[],
  node: SerializedLexicalNode,
): SerializedParagraphNode {
  return {
    ...node,
    children: convertLexicalPluginNodesToLexical({
      converters,
      lexicalPluginNodes: (node as any).children || [],
      parentNodeType: 'paragraph',
    }),

    type: 'paragraph',
    version: 1,
  } as SerializedParagraphNode
}
export function convertTextNode(node: SerializedLexicalNode): SerializedTextNode {
  return node as SerializedTextNode
}

export function convertNodeToFormat(node: SerializedLexicalNode): number {
  return (node as any).format
}
