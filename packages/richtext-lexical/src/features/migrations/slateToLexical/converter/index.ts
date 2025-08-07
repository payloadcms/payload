import type {
  SerializedEditorState,
  SerializedLexicalNode,
  SerializedParagraphNode,
  SerializedTextNode,
} from 'lexical'

import type { SlateNode, SlateNodeConverter } from './types.js'

import { NodeFormat } from '../../../../lexical/utils/nodeFormat.js'

export function convertSlateToLexical({
  converters,
  slateData,
}: {
  converters: SlateNodeConverter[]
  slateData: SlateNode[]
}): SerializedEditorState {
  return {
    root: {
      type: 'root',
      children: convertSlateNodesToLexical({
        canContainParagraphs: true,
        converters,
        parentNodeType: 'root',
        slateNodes: slateData,
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
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
  converters: SlateNodeConverter[] | undefined
  /**
   * Type of the parent lexical node (not the type of the original, parent slate type)
   */
  parentNodeType: string
  slateNodes: SlateNode[]
}): SerializedLexicalNode[] {
  if (!converters?.length || !slateNodes?.length) {
    return []
  }
  const unknownConverter = converters.find((converter) => converter.nodeTypes.includes('unknown'))
  // @ts-expect-error - vestiges of the migration to strict mode. Probably not important enough in this file to fix
  return (
    // Flatten in case we unwrap an array of child nodes
    slateNodes.flatMap((slateNode, i) => {
      if (!('type' in slateNode)) {
        if (canContainParagraphs) {
          // This is a paragraph node. They do not have a type property in Slate
          return convertParagraphNode(converters, slateNode)
        } else {
          // Unwrap generic Slate nodes recursively since depth wasn't guaranteed by Slate, especially when copy + pasting rich text
          // - If there are children and it can't be a paragraph in Lexical, assume that the generic node should be unwrapped until the text nodes, and only assume that its a text node when there are no more children
          if (slateNode.children) {
            return convertSlateNodesToLexical({
              canContainParagraphs,
              converters,
              parentNodeType,
              slateNodes: slateNode.children || [],
            })
          }
          // This is a simple text node. canContainParagraphs may be false if this is nested inside a paragraph already, since paragraphs cannot contain paragraphs
          return convertTextNode(slateNode)
        }
      }
      if (slateNode.type === 'p') {
        return convertParagraphNode(converters, slateNode)
      }

      const converter = converters.find((converter) =>
        converter.nodeTypes.includes(slateNode.type!),
      )

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
    type: 'paragraph',
    children: convertSlateNodesToLexical({
      canContainParagraphs: false,
      converters,
      parentNodeType: 'paragraph',
      slateNodes: node.children || [],
    }),
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
    version: 1,
  }
}
export function convertTextNode(node: SlateNode): SerializedTextNode {
  return {
    type: 'text',
    detail: 0,
    format: convertNodeToFormat(node),
    mode: 'normal',
    style: '',
    text: node.text ?? '',
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
