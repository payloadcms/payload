import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import { LexicalEditorTheme } from '../theme/EditorTheme'

export const defaultEditorLexicalConfig: LexicalEditorConfig = {
  namespace: 'lexical',
  theme: LexicalEditorTheme,
}
