import type { EditorConfig, SanitizedEditorConfig } from './types'

import { HeadingFeature } from '../../features/Heading'
import { ParagraphFeature } from '../../features/Paragraph'
import { BoldTextFeature } from '../../features/format/BoldText'
import { CodeTextFeature } from '../../features/format/CodeText'
import { ItalicTextFeature } from '../../features/format/ItalicText'
import { StrikethroughTextFeature } from '../../features/format/StrikethroughText'
import { SubscriptTextFeature } from '../../features/format/SubscriptText'
import { SuperscriptTextFeature } from '../../features/format/SuperscriptText'
import { UnderlineTextFeature } from '../../features/format/UnderlineText'
import { LexicalEditorTheme } from '../theme/EditorTheme'
import { sanitizeEditorConfig } from './sanitize'

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
    HeadingFeature({}),
  ],
  lexical: {
    namespace: 'lexical',
    theme: LexicalEditorTheme,
  },
}

export const defaultSanitizedEditorConfig: SanitizedEditorConfig =
  sanitizeEditorConfig(defaultEditorConfig)
