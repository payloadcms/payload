import type { SerializedLexicalNode } from 'lexical'

export function recurseNodes({
  callback,
  nodes,
}: {
  callback: (node: SerializedLexicalNode) => void
  nodes: SerializedLexicalNode[]
}) {
  for (const node of nodes) {
    callback(node)

    if ('children' in node && Array.isArray(node?.children) && node?.children?.length) {
      recurseNodes({ callback, nodes: node.children as SerializedLexicalNode[] })
    }
  }
}

export async function recurseNodesAsync({
  callback,
  nodes,
}: {
  callback: (node: SerializedLexicalNode) => Promise<void>
  nodes: SerializedLexicalNode[]
}) {
  for (const node of nodes) {
    await callback(node)

    if ('children' in node && Array.isArray(node?.children) && node?.children?.length) {
      await recurseNodesAsync({ callback, nodes: node.children as SerializedLexicalNode[] })
    }
  }
}
