import type { LexicalPluginNodeConverterProvider } from './types'

import { HeadingConverter } from './converters/heading'
import { LinkConverter } from './converters/link'
import { ListConverter } from './converters/list'
import { ListItemConverter } from './converters/listItem'
import { QuoteConverter } from './converters/quote'
import { UnknownConverter } from './converters/unknown'
import { UploadConverter } from './converters/upload'

export const defaultConverters: LexicalPluginNodeConverterProvider[] = [
  HeadingConverter,
  LinkConverter,
  ListConverter,
  ListItemConverter,
  QuoteConverter,
  UnknownConverter,
  UploadConverter,
]
