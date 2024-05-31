import type { SerializedLexicalNode } from 'lexical'

// Initialize both flattenedNodes and nodeIDMap
export const recurseNodeTree = ({
  flattenedNodes,
  nodeIDMap,
  nodes,
}: {
  flattenedNodes?: SerializedLexicalNode[]
  nodeIDMap?: {
    [key: string]: SerializedLexicalNode
  }
  nodes: SerializedLexicalNode[]
}): void => {
  for (const node of nodes) {
    if (flattenedNodes) {
      flattenedNodes.push(node)
    }
    if (nodeIDMap) {
      if ('id' in node && node.id) {
        nodeIDMap[node.id as string] = node
      } else if (
        'fields' in node &&
        typeof node.fields === 'object' &&
        'id' in node.fields &&
        node?.fields?.id
      ) {
        nodeIDMap[node.fields.id as string] = node
      }
    }

    if ('children' in node && Array.isArray(node?.children) && node?.children?.length) {
      recurseNodeTree({
        flattenedNodes,
        nodeIDMap,
        nodes: node.children as SerializedLexicalNode[],
      })
    }
  }
}
