import type { ElementNode } from 'lexical'

import type { ElementTransformer } from '../../../packages/@lexical/markdown/MarkdownTransformers.js'

export const createBlockNode = (
  createNode: (match: Array<string>) => ElementNode,
): ElementTransformer['replace'] => {
  return (parentNode, children, match) => {
    const node = createNode(match)
    if (node) {
      node.append(...children)
      parentNode.replace(node)
      node.select(0, 0)
    }
  }
}
