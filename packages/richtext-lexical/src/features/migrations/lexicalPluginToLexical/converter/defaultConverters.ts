import type { LexicalPluginNodeConverter } from './types.js'

import { HeadingConverter } from './converters/heading/converter.js'
import { LinkConverter } from './converters/link/converter.js'
import { ListConverter } from './converters/list/converter.js'
import { ListItemConverter } from './converters/listItem/converter.js'
import { QuoteConverter } from './converters/quote/converter.js'
import { UnknownConverter } from './converters/unknown/converter.js'
import { UploadConverter } from './converters/upload/converter.js'

export const defaultConverters: LexicalPluginNodeConverter[] = [
  HeadingConverter,
  LinkConverter,
  ListConverter,
  ListItemConverter,
  QuoteConverter,
  UnknownConverter,
  UploadConverter,
]
