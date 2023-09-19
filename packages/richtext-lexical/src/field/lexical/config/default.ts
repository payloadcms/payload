import type { EditorConfig } from './types'

import { LexicalEditorTheme } from '../theme/EditorTheme'

export const defaultEditorConfig: EditorConfig = {
  lexical: {
    namespace: 'lexical',
    theme: LexicalEditorTheme,
  },
}
