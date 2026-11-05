import type { LexicalNode } from 'lexical'

/** Move a top-level block one position within a Lexical update. */
export function $moveBlock({ direction, node }: { direction: -1 | 1; node: LexicalNode }) {
  const sibling = direction === -1 ? node.getPreviousSibling() : node.getNextSibling()

  if (sibling) {
    if (direction === -1) {
      sibling.insertBefore(node)
    } else {
      sibling.insertAfter(node)
    }
  }

  return node
}
