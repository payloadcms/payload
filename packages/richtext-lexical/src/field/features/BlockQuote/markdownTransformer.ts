import type { ElementTransformer } from '@lexical/markdown'

import { $createQuoteNode, $isQuoteNode, QuoteNode } from '@lexical/rich-text'
import { $createLineBreakNode } from 'lexical'
export const MarkdownTransformer: ElementTransformer = {
  dependencies: [QuoteNode],
  export: (node, exportChildren) => {
    if (!$isQuoteNode(node)) {
      return null
    }

    const lines = exportChildren(node).split('\n')
    const output = []
    for (const line of lines) {
      output.push('> ' + line)
    }
    return output.join('\n')
  },
  regExp: /^>\s/,
  replace: (parentNode, children, _match, isImport) => {
    if (isImport) {
      const previousNode = parentNode.getPreviousSibling()
      if ($isQuoteNode(previousNode)) {
        previousNode.splice(previousNode.getChildrenSize(), 0, [
          $createLineBreakNode(),
          ...children,
        ])
        previousNode.select(0, 0)
        parentNode.remove()
        return
      }
    }

    const node = $createQuoteNode()
    node.append(...children)
    parentNode.replace(node)
    node.select(0, 0)
  },
  type: 'element',
}
