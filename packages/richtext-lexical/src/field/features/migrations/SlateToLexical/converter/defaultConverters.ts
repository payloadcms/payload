import type { SlateNodeConverter } from './types'

import { HeadingConverter } from './converters/heading'
import { IndentConverter } from './converters/indent'
import { LinkConverter } from './converters/link'
import { ListItemConverter } from './converters/listItem'
import { OrderedListConverter } from './converters/orderedList'
import { RelationshipConverter } from './converters/relationship'
import { UnknownConverter } from './converters/unknown'
import { UnorderedListConverter } from './converters/unorderedList'
import { UploadConverter } from './converters/upload'

export const defaultConverters: SlateNodeConverter[] = [
  UnknownConverter,
  UploadConverter,
  UnorderedListConverter,
  OrderedListConverter,
  RelationshipConverter,
  ListItemConverter,
  LinkConverter,
  HeadingConverter,
  IndentConverter,
]
