import type { EditorConfig as LexicalEditorConfig } from 'lexical'

import type { FeatureProviderServer } from '../../../features/typesServer.js'
import type { ServerEditorConfig } from '../types.js'

import { AlignFeature } from '../../../features/align/server/index.js'
import { BlockquoteFeature } from '../../../features/blockquote/server/index.js'
import { BoldFeature } from '../../../features/format/bold/feature.server.js'
import { InlineCodeFeature } from '../../../features/format/inlineCode/feature.server.js'
import { ItalicFeature } from '../../../features/format/italic/feature.server.js'
import { StrikethroughFeature } from '../../../features/format/strikethrough/feature.server.js'
import { SubscriptFeature } from '../../../features/format/subscript/feature.server.js'
import { SuperscriptFeature } from '../../../features/format/superscript/feature.server.js'
import { UnderlineFeature } from '../../../features/format/underline/feature.server.js'
import { HeadingFeature } from '../../../features/heading/server/index.js'
import { HorizontalRuleFeature } from '../../../features/horizontalRule/server/index.js'
import { IndentFeature } from '../../../features/indent/server/index.js'
import { LinkFeature } from '../../../features/link/server/index.js'
import { ChecklistFeature } from '../../../features/lists/checklist/server/index.js'
import { OrderedListFeature } from '../../../features/lists/orderedList/server/index.js'
import { UnorderedListFeature } from '../../../features/lists/unorderedList/server/index.js'
import { ParagraphFeature } from '../../../features/paragraph/server/index.js'
import { RelationshipFeature } from '../../../features/relationship/server/index.js'
import { InlineToolbarFeature } from '../../../features/toolbars/inline/server/index.js'
import { UploadFeature } from '../../../features/upload/server/index.js'
import { LexicalEditorTheme } from '../../theme/EditorTheme.js'

export const defaultEditorLexicalConfig: LexicalEditorConfig = {
  namespace: 'lexical',
  theme: LexicalEditorTheme,
}

export const defaultEditorFeatures: FeatureProviderServer<any, any, any>[] = [
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
  ChecklistFeature(),
  LinkFeature(),
  RelationshipFeature(),
  BlockquoteFeature(),
  UploadFeature(),
  HorizontalRuleFeature(),
  InlineToolbarFeature(),
]

export const defaultEditorConfig: ServerEditorConfig = {
  features: defaultEditorFeatures,
  lexical: defaultEditorLexicalConfig,
}
