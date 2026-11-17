import type { SerializedLexicalNode } from 'lexical'

/**
 * Returns the node's `direction` only when it is explicitly set. `null` means the direction was
 * never overridden, so no `dir` should be rendered.
 */
export function getExplicitDirection({
  node,
}: {
  node: SerializedLexicalNode
}): 'ltr' | 'rtl' | undefined {
  if ('direction' in node && (node.direction === 'ltr' || node.direction === 'rtl')) {
    return node.direction
  }
  return undefined
}
