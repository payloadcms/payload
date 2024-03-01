import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import type { FeatureProviderServer } from '../../../features/types'
import type { SanitizedServerEditorConfig, ServerEditorConfig } from '../types'

import { HeadingFeature } from '../../../features/Heading1'
import { ParagraphFeature } from '../../../features/Paragraph1'
import { RelationshipFeature } from '../../../features/Relationship1'
import { UploadFeature } from '../../../features/Upload1'
import { AlignFeature } from '../../../features/align1/feature.server'
import { BlockQuoteFeature } from '../../../features/blockquote2/feature.server'
import { BoldTextFeature } from '../../../features/format/Bold8'
import { InlineCodeTextFeature } from '../../../features/format/InlineCode1'
import { ItalicTextFeature } from '../../../features/format/Italic1'
import { StrikethroughTextFeature } from '../../../features/format/strikethrough'
import { SubscriptTextFeature } from '../../../features/format/subscript'
import { SuperscriptTextFeature } from '../../../features/format/superscript'
import { UnderlineTextFeature } from '../../../features/format/underline'
import { IndentFeature } from '../../../features/indent'
import { LinkFeature } from '../../../features/link1/feature.server'
import { CheckListFeature } from '../../../features/lists1/CheckList1'
import { OrderedListFeature } from '../../../features/lists1/OrderedList1'
import { UnorderedListFeature } from '../../../features/lists1/UnorderedList1'
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
