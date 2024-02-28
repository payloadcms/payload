import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import type { FeatureProviderServer } from '../../../features/types'
import type { SanitizedServerEditorConfig, ServerEditorConfig } from '../types'

import { BlockQuoteFeature } from '../../../features/BlockQuote'
import { HeadingFeature } from '../../../features/Heading'
import { ParagraphFeature } from '../../../features/Paragraph'
import { RelationshipFeature } from '../../../features/Relationship'
import { UploadFeature } from '../../../features/Upload'
import { AlignFeature } from '../../../features/align/feature.server'
import { BoldTextFeature } from '../../../features/format/Bold'
import { InlineCodeTextFeature } from '../../../features/format/InlineCode'
import { ItalicTextFeature } from '../../../features/format/Italic'
import { StrikethroughTextFeature } from '../../../features/format/strikethrough'
import { SubscriptTextFeature } from '../../../features/format/subscript'
import { SuperscriptTextFeature } from '../../../features/format/superscript'
import { UnderlineTextFeature } from '../../../features/format/underline'
import { IndentFeature } from '../../../features/indent'
import { LinkFeature } from '../../../features/link/feature.server'
import { CheckListFeature } from '../../../features/lists/CheckList'
import { OrderedListFeature } from '../../../features/lists/OrderedList'
import { UnorderedListFeature } from '../../../features/lists/UnorderedList'
import { LexicalEditorTheme } from '../../theme/EditorTheme'
import { sanitizeServerEditorConfig } from './sanitize'

export const defaultEditorLexicalConfig: LexicalEditorConfig = {
  namespace: 'lexical',
  theme: LexicalEditorTheme,
}

export const defaultEditorFeatures: FeatureProviderServer<unknown, unknown>[] = [
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
]

export const defaultEditorConfig: ServerEditorConfig = {
  features: defaultEditorFeatures,
  lexical: defaultEditorLexicalConfig,
}

export const defaultSanitizedServerEditorConfig: SanitizedServerEditorConfig =
  sanitizeServerEditorConfig(defaultEditorConfig)
