import type { EditorConfig } from './types'

import { ParagraphFeature } from '../../features/Paragraph'
import { BoldTextFeature } from '../../features/format/BoldText'
import { CodeTextFeature } from '../../features/format/CodeText'
import { ItalicTextFeature } from '../../features/format/ItalicText'
import { StrikethroughTextFeature } from '../../features/format/StrikethroughText'
import { SubscriptTextFeature } from '../../features/format/SubscriptText'
import { SuperscriptTextFeature } from '../../features/format/SuperscriptText'
import { UnderlineTextFeature } from '../../features/format/UnderlineText'
import { LexicalEditorTheme } from '../theme/EditorTheme'

export const defaultEditorConfig: EditorConfig = {
  features: [
    BoldTextFeature(),
    ItalicTextFeature(),
    UnderlineTextFeature(),
    StrikethroughTextFeature(),
    SubscriptTextFeature(),
    SuperscriptTextFeature(),
    CodeTextFeature(),
    ParagraphFeature(),
  ],
  lexical: {
    namespace: 'lexical',
    theme: LexicalEditorTheme,
  },
}
