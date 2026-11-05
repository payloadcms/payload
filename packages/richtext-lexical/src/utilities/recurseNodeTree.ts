import type { SerializedLexicalNode } from 'lexical'

export const getNodeID = ({ node }: { node: SerializedLexicalNode }): string | undefined => {
  if (node && 'id' in node && node.id) {
    return node.id as string
  }

  if (
    'fields' in node &&
    typeof node.fields === 'object' &&
    node.fields &&
    'id' in node.fields &&
    node.fields.id
  ) {
    return node.fields.id as string
  }
}

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
  if (!nodes?.length) {
    return
  }

  for (const node of nodes) {
    if (flattenedNodes) {
      flattenedNodes.push(node)
    }
    if (nodeIDMap) {
      const nodeID = getNodeID({ node })

      if (nodeID) {
        nodeIDMap[nodeID] = node
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
