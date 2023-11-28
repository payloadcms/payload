import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import type { EditorConfig } from './types'
import type { SanitizedEditorConfig } from './types'

import { LexicalEditorTheme } from '../theme/EditorTheme'
import { defaultEditorFeatures } from './default'
import { sanitizeEditorConfig } from './sanitize'

export const defaultEditorLexicalConfig: LexicalEditorConfig = {
  namespace: 'lexical',
  theme: LexicalEditorTheme,
}
export const defaultEditorConfig: EditorConfig = {
  features: defaultEditorFeatures,
  lexical: defaultEditorLexicalConfig,
}

export const defaultSanitizedEditorConfig: SanitizedEditorConfig =
  sanitizeEditorConfig(defaultEditorConfig)
