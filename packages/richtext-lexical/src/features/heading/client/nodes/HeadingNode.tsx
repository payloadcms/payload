// This wrapper was created because HeadingNode doesn't handle indents in HTML import/export.
import type { HeadingTagType, SerializedHeadingNode } from '@lexical/rich-text'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  ElementFormatType,
  NodeKey,
  ParagraphNode,
  RangeSelection,
} from 'lexical'

import { HeadingNode as BaseHeadingNode } from '@lexical/rich-text'
import { $applyNodeReplacement, $createParagraphNode } from 'lexical'

export class HeadingNode extends BaseHeadingNode {
  constructor(tag: HeadingTagType, key?: NodeKey) {
    super(tag, key)
  }
  static clone(node: HeadingNode): HeadingNode {
    return new HeadingNode(node.__tag, node.__key)
  }
  static importDOM(): DOMConversionMap | null {
    return {
      h1: (node: Node) => ({
        conversion: $convertHeadingElement,
        priority: 0,
      }),
      h2: (node: Node) => ({
        conversion: $convertHeadingElement,
        priority: 0,
      }),
      h3: (node: Node) => ({
        conversion: $convertHeadingElement,
        priority: 0,
      }),
      h4: (node: Node) => ({
        conversion: $convertHeadingElement,
        priority: 0,
      }),
      h5: (node: Node) => ({
        conversion: $convertHeadingElement,
        priority: 0,
      }),
      h6: (node: Node) => ({
        conversion: $convertHeadingElement,
        priority: 0,
      }),
      p: (node: Node) => {
        // domNode is a <p> since we matched it by nodeName
        const paragraph = node as HTMLParagraphElement
        const firstChild = paragraph.firstChild
        if (firstChild !== null && isGoogleDocsTitle(firstChild)) {
          return {
            conversion: () => ({ node: null }),
            priority: 3,
          }
        }
        return null
      },
      span: (node: Node) => {
        if (isGoogleDocsTitle(node)) {
          return {
            conversion: (domNode: Node) => {
              return {
                node: $createHeadingNode('h1'),
              }
            },
            priority: 3,
          }
        }
        return null
      },
    }
  }

  static importJSON(serializedNode: SerializedHeadingNode): HeadingNode {
    const node = $createHeadingNode(serializedNode.tag)
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  // Not add exportDOM because payloadcms exports with HTMLConverterFeature.

  collapseAtStart(): true {
    const newElement = !this.isEmpty() ? $createHeadingNode(this.getTag()) : $createParagraphNode()
    const children = this.getChildren()
    children.forEach((child) => newElement.append(child))
    this.replace(newElement)
    return true
  }

  // Mutation
  insertNewAfter(selection?: RangeSelection, restoreSelection = true): HeadingNode | ParagraphNode {
    const anchorOffet = selection ? selection.anchor.offset : 0
    const lastDesc = this.getLastDescendant()
    const isAtEnd =
      !lastDesc ||
      (selection &&
        selection.anchor.key === lastDesc.getKey() &&
        anchorOffet === lastDesc.getTextContentSize())
    const newElement =
      isAtEnd || !selection ? $createParagraphNode() : $createHeadingNode(this.getTag())
    const direction = this.getDirection()
    newElement.setDirection(direction)
    this.insertAfter(newElement, restoreSelection)
    if (anchorOffet === 0 && !this.isEmpty() && selection) {
      const paragraph = $createParagraphNode()
      paragraph.select()
      this.replace(paragraph, true)
    }
    return newElement
  }
}

function isGoogleDocsTitle(domNode: Node): boolean {
  if (domNode.nodeName.toLowerCase() === 'span') {
    return (domNode as HTMLSpanElement).style.fontSize === '26pt'
  }
  return false
}

export function $createHeadingNode(headingTag: HeadingTagType): HeadingNode {
  return $applyNodeReplacement(new HeadingNode(headingTag))
}

export function $convertHeadingElement(element: HTMLElement): DOMConversionOutput {
  const nodeName = element.nodeName.toLowerCase()
  let node = null
  if (
    nodeName === 'h1' ||
    nodeName === 'h2' ||
    nodeName === 'h3' ||
    nodeName === 'h4' ||
    nodeName === 'h5' ||
    nodeName === 'h6'
  ) {
    node = $createHeadingNode(nodeName)
    if (element.style !== null) {
      node.setFormat(element.style.textAlign as ElementFormatType)
      const indent = parseInt(element.style.textIndent, 10) / 20
      if (indent > 0) {
        node.setIndent(indent)
      }
    }
  }
  return { node }
}

export { $isHeadingNode } from '@lexical/rich-text'
