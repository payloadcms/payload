import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import type { FeatureProviderServer } from '../../../features/types'
import type { SanitizedServerEditorConfig, ServerEditorConfig } from '../types'

import { AlignFeature } from '../../../features/align/feature.server'
import { BlockQuoteFeature } from '../../../features/blockquote/feature.server'
import { BoldFeature } from '../../../features/format/bold/feature.server'
import { InlineCodeFeature } from '../../../features/format/inlinecode/feature.server'
import { ItalicFeature } from '../../../features/format/italic/feature.server'
import { StrikethroughFeature } from '../../../features/format/strikethrough/feature.server'
import { SubscriptFeature } from '../../../features/format/subscript/feature.server'
import { SuperscriptFeature } from '../../../features/format/superscript/feature.server'
import { UnderlineFeature } from '../../../features/format/underline/feature.server'
import { HeadingFeature } from '../../../features/heading'
import { IndentFeature } from '../../../features/indent'
import { LinkFeature } from '../../../features/link/feature.server'
import { CheckListFeature } from '../../../features/lists/checklist'
import { OrderedListFeature } from '../../../features/lists/orderedlist'
import { UnorderedListFeature } from '../../../features/lists/unorderedlist'
import { ParagraphFeature } from '../../../features/paragraph'
import { RelationshipFeature } from '../../../features/relationship'
import { UploadFeature } from '../../../features/upload'
import { LexicalEditorTheme } from '../../theme/EditorTheme'
import { sanitizeServerEditorConfig } from './sanitize'

export const defaultEditorLexicalConfig: LexicalEditorConfig = {
  namespace: 'lexical',
  theme: LexicalEditorTheme,
}

export const defaultEditorFeatures: FeatureProviderServer<unknown, unknown>[] = [
  BoldFeature(),
  ItalicFeature(),
  UnderlineFeature(),
  StrikethroughFeature(),
  SubscriptFeature(),
  SuperscriptFeature(),
  InlineCodeFeature(),
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
