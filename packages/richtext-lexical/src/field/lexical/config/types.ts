import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import type { Feature, SanitizedFeatures } from '../../features/types'

export type EditorConfig = {
  features: Feature[]
  lexical: LexicalEditorConfig
}

export type SanitizedEditorConfig = {
  features: SanitizedFeatures
  lexical: LexicalEditorConfig
}
