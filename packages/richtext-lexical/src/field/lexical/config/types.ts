import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import type { FeatureProvider, SanitizedFeatures } from '../../features/types'

export type EditorConfig = {
  features: FeatureProvider[]
  lexical: LexicalEditorConfig
}

export type SanitizedEditorConfig = {
  features: SanitizedFeatures
  lexical: LexicalEditorConfig
}
