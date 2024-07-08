import type { LexicalNode } from 'lexical'

import type { NodeWithHooks } from './typesServer.js'

/**
 * Utility function to create a node with hooks. You don't have to use this utility, but it improves type inference
 * @param node the node
 */
export function createNode<Node extends LexicalNode>(
  node: NodeWithHooks<Node>,
): NodeWithHooks<Node> {
  return node
}
