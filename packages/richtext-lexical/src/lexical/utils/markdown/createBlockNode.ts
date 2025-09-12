import type { ElementTransformer } from '@lexical/markdown'
import type { ElementNode } from 'lexical'

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
