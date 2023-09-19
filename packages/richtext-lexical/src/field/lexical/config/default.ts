import type { EditorConfig } from './types'

import { BoldTextFeature } from '../../features/format/BoldText'
import { ItalicTextFeature } from '../../features/format/ItalicText'
import { UnderlineTextFeature } from '../../features/format/UnderlineText'
import { LexicalEditorTheme } from '../theme/EditorTheme'

export const defaultEditorConfig: EditorConfig = {
  features: [BoldTextFeature(), ItalicTextFeature(), UnderlineTextFeature()],
  lexical: {
    namespace: 'lexical',
    theme: LexicalEditorTheme,
  },
}
