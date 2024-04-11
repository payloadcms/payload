import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor.js'

import type { FeatureProviderServer } from '../../../features/types.js'
import type { SanitizedServerEditorConfig, ServerEditorConfig } from '../types.js'

import { AlignFeature } from '../../../features/align/feature.server.js'
import { BlockQuoteFeature } from '../../../features/blockquote/feature.server.js'
import { BoldFeature } from '../../../features/format/bold/feature.server.js'
import { InlineCodeFeature } from '../../../features/format/inlinecode/feature.server.js'
import { ItalicFeature } from '../../../features/format/italic/feature.server.js'
import { StrikethroughFeature } from '../../../features/format/strikethrough/feature.server.js'
import { SubscriptFeature } from '../../../features/format/subscript/feature.server.js'
import { SuperscriptFeature } from '../../../features/format/superscript/feature.server.js'
import { UnderlineFeature } from '../../../features/format/underline/feature.server.js'
import { HeadingFeature } from '../../../features/heading/feature.server.js'
import { HorizontalRuleFeature } from '../../../features/horizontalrule/feature.server.js'
import { IndentFeature } from '../../../features/indent/feature.server.js'
import { LinkFeature } from '../../../features/link/feature.server.js'
import { CheckListFeature } from '../../../features/lists/checklist/feature.server.js'
import { OrderedListFeature } from '../../../features/lists/orderedlist/feature.server.js'
import { UnorderedListFeature } from '../../../features/lists/unorderedlist/feature.server.js'
import { ParagraphFeature } from '../../../features/paragraph/feature.server.js'
import { RelationshipFeature } from '../../../features/relationship/feature.server.js'
import { UploadFeature } from '../../../features/upload/feature.server.js'
import { LexicalEditorTheme } from '../../theme/EditorTheme.js'
import { sanitizeServerEditorConfig } from './sanitize.js'

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
  HeadingFeature(),
  AlignFeature(),
  IndentFeature(),
  UnorderedListFeature(),
  OrderedListFeature(),
  CheckListFeature(),
  LinkFeature(),
  RelationshipFeature(),
  BlockQuoteFeature(),
  UploadFeature(),
  HorizontalRuleFeature(),
]

export const defaultEditorConfig: ServerEditorConfig = {
  features: defaultEditorFeatures,
  lexical: defaultEditorLexicalConfig,
}

export const defaultSanitizedServerEditorConfig: SanitizedServerEditorConfig =
  sanitizeServerEditorConfig(defaultEditorConfig)
