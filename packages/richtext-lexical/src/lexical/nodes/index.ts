import type { Klass, LexicalNode, LexicalNodeReplacement } from 'lexical'

import type { SanitizedClientEditorConfig, SanitizedServerEditorConfig } from '../config/types.js'

export function getEnabledNodes({
  editorConfig,
}: {
  editorConfig: SanitizedClientEditorConfig | SanitizedServerEditorConfig
}): Array<Klass<LexicalNode> | LexicalNodeReplacement> {
  return editorConfig.features.nodes.map((node) => {
    if ('node' in node) {
      return node.node
    }
    return node
  })
}
