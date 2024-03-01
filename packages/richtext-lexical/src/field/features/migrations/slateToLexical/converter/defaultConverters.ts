import type { SlateNodeConverterProvider } from './types'

import { SlateBlockquoteConverter } from './converters/blockquote'
import { SlateHeadingConverter } from './converters/heading'
import { SlateIndentConverter } from './converters/indent'
import { SlateLinkConverter } from './converters/link'
import { SlateListItemConverter } from './converters/listItem'
import { SlateOrderedListConverter } from './converters/orderedList'
import { SlateRelationshipConverter } from './converters/relationship'
import { SlateUnknownConverter } from './converters/unknown'
import { SlateUnorderedListConverter } from './converters/unorderedList'
import { SlateUploadConverter } from './converters/upload'

export const defaultSlateConverters: SlateNodeConverterProvider[] = [
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
