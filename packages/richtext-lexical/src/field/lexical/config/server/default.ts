import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import type { FeatureProviderServer } from '../../../features/types'
import type { SanitizedServerEditorConfig, ServerEditorConfig } from '../types'

import { AlignFeature } from '../../../features/align/feature.server'
import { BlockQuoteFeature } from '../../../features/blockquote/feature.server'
import { BoldTextFeature } from '../../../features/format/bold'
import { InlineCodeTextFeature } from '../../../features/format/inlinecode'
import { ItalicTextFeature } from '../../../features/format/italic'
import { StrikethroughTextFeature } from '../../../features/format/strikethrough'
import { SubscriptTextFeature } from '../../../features/format/subscript'
import { SuperscriptTextFeature } from '../../../features/format/superscript'
import { UnderlineTextFeature } from '../../../features/format/underline'
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
