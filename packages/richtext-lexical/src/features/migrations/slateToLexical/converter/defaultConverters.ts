import type { SlateNodeConverter } from './types.js'

import { SlateBlockquoteConverter } from './converters/blockquote/converter.js'
import { SlateHeadingConverter } from './converters/heading/converter.js'
import { SlateIndentConverter } from './converters/indent/converter.js'
import { SlateLinkConverter } from './converters/link/converter.js'
import { SlateListItemConverter } from './converters/listItem/converter.js'
import { SlateOrderedListConverter } from './converters/orderedList/converter.js'
import { SlateRelationshipConverter } from './converters/relationship/converter.js'
import { SlateUnknownConverter } from './converters/unknown/converter.js'
import { SlateUnorderedListConverter } from './converters/unorderedList/converter.js'
import { SlateUploadConverter } from './converters/upload/converter.js'

export const defaultSlateConverters: SlateNodeConverter[] = [
  SlateBlockquoteConverter,
  SlateHeadingConverter,
  SlateIndentConverter,
  SlateLinkConverter,
  SlateListItemConverter,
  SlateOrderedListConverter,
  SlateRelationshipConverter,
  SlateUnorderedListConverter,
  SlateUploadConverter,
  SlateUnknownConverter,
]
