import type { EditorConfig, SanitizedEditorConfig } from './types'

import { HeadingFeature } from '../../features/Heading'
import { ParagraphFeature } from '../../features/Paragraph'
import { BoldTextFeature } from '../../features/format/Bold'
import { InlineCodeTextFeature } from '../../features/format/InlineCode'
import { ItalicTextFeature } from '../../features/format/Italic'
import { StrikethroughTextFeature } from '../../features/format/strikethrough'
import { SubscriptTextFeature } from '../../features/format/subscript'
import { SuperscriptTextFeature } from '../../features/format/superscript'
import { UnderlineTextFeature } from '../../features/format/underline'
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
    InlineCodeTextFeature(),
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
