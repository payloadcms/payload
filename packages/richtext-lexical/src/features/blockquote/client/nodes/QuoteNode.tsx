// This wrapper was created because QuoteNode doesn't handle indents in HTML import/export.
import type { SerializedQuoteNode } from '@lexical/rich-text'
import type { DOMConversionMap, DOMConversionOutput, ElementFormatType, NodeKey } from 'lexical'

import { QuoteNode as BaseQuoteNode } from '@lexical/rich-text'
import { $applyNodeReplacement } from 'lexical'

export class QuoteNode extends BaseQuoteNode {
  constructor(key?: NodeKey) {
    super(key)
  }
  static clone(node: QuoteNode): QuoteNode {
    return new QuoteNode(node.__key)
  }
  static importDOM(): DOMConversionMap | null {
    return {
      blockquote: (node: Node) => ({
        conversion: $convertBlockquoteElement,
        priority: 0,
      }),
    }
  }

  static importJSON(serializedNode: SerializedQuoteNode): QuoteNode {
    const node = $createQuoteNode()
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  // Not add exportDOM because payloadcms exports with HTMLConverterFeature.
}
export function $createQuoteNode(): QuoteNode {
  return $applyNodeReplacement(new QuoteNode())
}

export function $convertBlockquoteElement(element: HTMLElement): DOMConversionOutput {
  const node = $createQuoteNode()
  if (element.style !== null) {
    node.setFormat(element.style.textAlign as ElementFormatType)
    const indent = parseInt(element.style.textIndent, 10) / 20
    if (indent > 0) {
      node.setIndent(indent)
    }
  }
  return { node }
}

export { $isQuoteNode } from '@lexical/rich-text'
