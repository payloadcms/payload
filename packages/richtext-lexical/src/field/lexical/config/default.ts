import type { EditorConfig, SanitizedEditorConfig } from './types'

import { HeadingFeature } from '../../features/Heading'
import { LinkFeature } from '../../features/Link'
import { ParagraphFeature } from '../../features/Paragraph'
import { AlignFeature } from '../../features/align'
import { BoldTextFeature } from '../../features/format/Bold'
import { InlineCodeTextFeature } from '../../features/format/InlineCode'
import { ItalicTextFeature } from '../../features/format/Italic'
import { StrikethroughTextFeature } from '../../features/format/strikethrough'
import { SubscriptTextFeature } from '../../features/format/subscript'
import { SuperscriptTextFeature } from '../../features/format/superscript'
import { UnderlineTextFeature } from '../../features/format/underline'
import { IndentFeature } from '../../features/indent'
import { CheckListFeature } from '../../features/lists/CheckList'
import { OrderedListFeature } from '../../features/lists/OrderedList'
import { UnoderedListFeature } from '../../features/lists/UnorderedList'
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
    AlignFeature(),
    IndentFeature(),
    UnoderedListFeature(),
    OrderedListFeature(),
    CheckListFeature(),
    LinkFeature(),
  ],
  lexical: {
    namespace: 'lexical',
    theme: LexicalEditorTheme,
  },
}

export const defaultSanitizedEditorConfig: SanitizedEditorConfig =
  sanitizeEditorConfig(defaultEditorConfig)
