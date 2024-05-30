import type { FeatureProvider } from '../../features/types'
import type { EditorConfig, SanitizedEditorConfig } from './types'

import { BlockQuoteFeature } from '../../features/BlockQuote'
import { HeadingFeature } from '../../features/Heading'
import { LinkFeature } from '../../features/Link'
import { ParagraphFeature } from '../../features/Paragraph'
import { RelationshipFeature } from '../../features/Relationship'
import { UploadFeature } from '../../features/Upload'
import { AlignFeature } from '../../features/align'
import { BoldTextFeature } from '../../features/format/Bold'
import { InlineCodeTextFeature } from '../../features/format/InlineCode'
import { ItalicTextFeature } from '../../features/format/Italic'
import { StrikethroughTextFeature } from '../../features/format/strikethrough'
import { SubscriptTextFeature } from '../../features/format/subscript'
import { SuperscriptTextFeature } from '../../features/format/superscript'
import { UnderlineTextFeature } from '../../features/format/underline'
import { HorizontalRuleFeature } from '../../features/horizontalrule'
import { IndentFeature } from '../../features/indent'
import { CheckListFeature } from '../../features/lists/CheckList'
import { OrderedListFeature } from '../../features/lists/OrderedList'
import { UnorderedListFeature } from '../../features/lists/UnorderedList'
import { sanitizeEditorConfig } from './sanitize'

export const defaultEditorFeatures: FeatureProvider[] = [
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
  UnorderedListFeature(),
  OrderedListFeature(),
  CheckListFeature(),
  LinkFeature({}),
  RelationshipFeature(),
  BlockQuoteFeature(),
  UploadFeature(),
  HorizontalRuleFeature(),
  //BlocksFeature(), // Adding this by default makes no sense if no blocks are defined
]

export const defaultEditorConfig: EditorConfig = {
  features: defaultEditorFeatures,
  lexical: () =>
    // @ts-expect-error
    import('./defaultClient').then((module) => {
      const defaultEditorLexicalConfig = module.defaultEditorLexicalConfig
      return defaultEditorLexicalConfig
    }),
}

export const defaultSanitizedEditorConfig: SanitizedEditorConfig =
  sanitizeEditorConfig(defaultEditorConfig)
