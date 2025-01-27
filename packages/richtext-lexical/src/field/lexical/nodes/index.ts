import type { Klass, LexicalNode } from 'lexical'
import type { LexicalNodeReplacement } from 'lexical'

import type { SanitizedEditorConfig } from '../config/types'

export function getEnabledNodes({
  editorConfig,
}: {
  editorConfig: SanitizedEditorConfig
}): Array<Klass<LexicalNode> | LexicalNodeReplacement> {
  return editorConfig.features.nodes.map((node) => node.node)
}
