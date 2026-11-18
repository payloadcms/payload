import type { SerializedLexicalNode } from 'lexical'

import { getChildNodes } from './getChildNodes.js'

export function recurseNodes({
  callback,
  nodes,
}: {
  callback: (node: SerializedLexicalNode) => void
  nodes: SerializedLexicalNode[]
}) {
  for (const node of nodes) {
    callback(node)

    const childNodes = getChildNodes(node)
    if (childNodes.length) {
      recurseNodes({ callback, nodes: childNodes })
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

    const childNodes = getChildNodes(node)
    if (childNodes.length) {
      await recurseNodesAsync({ callback, nodes: childNodes })
    }
  }
}
