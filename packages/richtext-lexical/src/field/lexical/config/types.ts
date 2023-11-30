import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import type { FeatureProvider, ResolvedFeatureMap, SanitizedFeatures } from '../../features/types'

export type EditorConfig = {
  features: FeatureProvider[]
  lexical?: () => Promise<LexicalEditorConfig>
}

export type SanitizedEditorConfig = {
  features: SanitizedFeatures
  lexical: () => Promise<LexicalEditorConfig>
  resolvedFeatureMap: ResolvedFeatureMap
}
