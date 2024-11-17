import type { Klass, LexicalNode, LexicalNodeReplacement } from 'lexical'

import type { NodeWithHooks } from '../../features/typesServer.js'
import type { SanitizedClientEditorConfig, SanitizedServerEditorConfig } from '../config/types.js'

export function getEnabledNodes({
  editorConfig,
}: {
  editorConfig: SanitizedClientEditorConfig | SanitizedServerEditorConfig
}): Array<Klass<LexicalNode> | LexicalNodeReplacement> {
  return getEnabledNodesFromServerNodes({
    nodes: editorConfig.features.nodes,
  })
}

export function getEnabledNodesFromServerNodes({
  nodes,
}: {
  nodes: Array<Klass<LexicalNode> | LexicalNodeReplacement> | Array<NodeWithHooks>
}): Array<Klass<LexicalNode> | LexicalNodeReplacement> {
  return nodes.map((node) => {
    if ('node' in node) {
      return node.node
    }
    return node
  })
}
