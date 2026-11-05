import { BoldFeature } from '../features/format/bold/feature.server.js'
import { ItalicFeature } from '../features/format/italic/feature.server.js'
import { StrikethroughFeature } from '../features/format/strikethrough/feature.server.js'
import { HeadingFeature } from '../features/heading/server/index.js'
import { OrderedListFeature } from '../features/lists/orderedList/server/index.js'
import { UnorderedListFeature } from '../features/lists/unorderedList/server/index.js'
import { ParagraphFeature } from '../features/paragraph/server/index.js'
import { FixedToolbarFeature } from '../features/toolbars/fixed/server/index.js'
import { InlineToolbarFeature } from '../features/toolbars/inline/server/index.js'

export const getLLMInstructionsFeatures = () => [
  ParagraphFeature(),
  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
  BoldFeature(),
  ItalicFeature(),
  StrikethroughFeature(),
  UnorderedListFeature(),
  OrderedListFeature(),
  FixedToolbarFeature(),
  InlineToolbarFeature(),
]
