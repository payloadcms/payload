import type { Klass, LexicalNode } from 'lexical'

import type { SanitizedEditorConfig } from '../config/types'

export function getEnabledNodes({
  editorConfig,
}: {
  editorConfig: SanitizedEditorConfig
}): Array<Klass<LexicalNode>> {
  return editorConfig.features.nodes.map((node) => node.node)
}
