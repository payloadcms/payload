import type {
  SerializedEditorState,
  SerializedLexicalNode,
  SerializedParagraphNode,
  SerializedTextNode,
} from 'lexical'

import type { SlateNode, SlateNodeConverter } from './types'

import { NodeFormat } from '../../../../lexical/utils/nodeFormat'

export function convertSlateToLexical({
  converters,
  slateData,
}: {
  converters: SlateNodeConverter[]
  slateData: SlateNode[]
}): SerializedEditorState {
  return {
    root: {
      children: convertSlateNodesToLexical({
        canContainParagraphs: true,
        converters,
        parentNodeType: 'root',
        slateNodes: slateData,
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

export function convertSlateNodesToLexical({
  canContainParagraphs,
  converters,
  parentNodeType,
  slateNodes,
}: {
  canContainParagraphs: boolean
  converters: SlateNodeConverter[]
  /**
   * Type of the parent lexical node (not the type of the original, parent slate type)
   */
  parentNodeType: string
  slateNodes: SlateNode[]
}): SerializedLexicalNode[] {
  const unknownConverter = converters.find((converter) => converter.nodeTypes.includes('unknown'))
  return (
    slateNodes.map((slateNode, i) => {
      if (!('type' in slateNode)) {
        if (canContainParagraphs) {
          // This is a paragraph node. They do not have a type property in Slate
          return convertParagraphNode(converters, slateNode)
        } else {
          // This is a simple text node. canContainParagraphs may be false if this is nested inside of a paragraph already, since paragraphs cannot contain paragraphs
          return convertTextNode(slateNode)
        }
      }
      if (slateNode.type === 'p') {
        return convertParagraphNode(converters, slateNode)
      }

      const converter = converters.find((converter) => converter.nodeTypes.includes(slateNode.type))

      if (converter) {
        return converter.converter({ childIndex: i, converters, parentNodeType, slateNode })
      }

      console.warn('slateToLexical > No converter found for node type: ' + slateNode.type)
      return unknownConverter?.converter({
        childIndex: i,
        converters,
        parentNodeType,
        slateNode,
      })
    }) || []
  )
}

export function convertParagraphNode(
  converters: SlateNodeConverter[],
  node: SlateNode,
): SerializedParagraphNode {
  return {
    children: convertSlateNodesToLexical({
      canContainParagraphs: false,
      converters,
      parentNodeType: 'paragraph',
      slateNodes: node.children || [],
    }),
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
  }
}
export function convertTextNode(node: SlateNode): SerializedTextNode {
  return {
    detail: 0,
    format: convertNodeToFormat(node),
    mode: 'normal',
    style: '',
    text: node.text,
    type: 'text',
    version: 1,
  }
}

export function convertNodeToFormat(node: SlateNode): number {
  let format = 0
  if (node.bold) {
    format = format | NodeFormat.IS_BOLD
  }
  if (node.italic) {
    format = format | NodeFormat.IS_ITALIC
  }
  if (node.strikethrough) {
    format = format | NodeFormat.IS_STRIKETHROUGH
  }
  if (node.underline) {
    format = format | NodeFormat.IS_UNDERLINE
  }
  if (node.subscript) {
    format = format | NodeFormat.IS_SUBSCRIPT
  }
  if (node.superscript) {
    format = format | NodeFormat.IS_SUPERSCRIPT
  }
  if (node.code) {
    format = format | NodeFormat.IS_CODE
  }
  return format
}
