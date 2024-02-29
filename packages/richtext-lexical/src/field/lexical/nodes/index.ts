import type { Klass, LexicalNode } from 'lexical'
import type { LexicalNodeReplacement } from 'lexical'

import type { SanitizedClientEditorConfig, SanitizedServerEditorConfig } from '../config/types'

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
