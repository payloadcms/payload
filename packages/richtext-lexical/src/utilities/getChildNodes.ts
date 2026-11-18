import type { SerializedLexicalNode } from 'lexical'

/**
 * Returns the child nodes of a serialized Lexical node: its `children` plus
 * any nodes stored in named slots (`$slots`).
 *
 * Lexical 0.4x added named slots (`$setSlot` / `$getSlot`). A slot host
 * serializes slot values under `$slots`, not `children`, so walkers that only
 * follow `children` silently skip slot content - it is never populated,
 * hooked or validated. Only object slot values are visited: a slot value is
 * a node, anything else is ignored.
 */
export function getChildNodes(node: SerializedLexicalNode): SerializedLexicalNode[] {
  const childNodes: SerializedLexicalNode[] = []

  if ('children' in node && Array.isArray(node.children)) {
    childNodes.push(...(node.children as SerializedLexicalNode[]))
  }

  const slots = (node as { $slots?: Record<string, unknown> }).$slots
  if (slots && typeof slots === 'object') {
    for (const slotValue of Object.values(slots)) {
      if (slotValue && typeof slotValue === 'object') {
        childNodes.push(slotValue as SerializedLexicalNode)
      }
    }
  }

  return childNodes
}
