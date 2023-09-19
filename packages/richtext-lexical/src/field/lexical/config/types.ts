import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import type { Feature } from '../../features/types'

export type EditorConfig = {
  features: Feature[]
  lexical: LexicalEditorConfig
}
