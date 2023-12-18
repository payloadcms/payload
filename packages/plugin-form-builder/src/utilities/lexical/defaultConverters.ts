import type { HTMLConverter } from './types'

import { HeadingHTMLConverter } from './converters/heading'
import { LinebreakHTMLConverter } from './converters/linebreak'
import { LinkHTMLConverter } from './converters/link'
import { ListHTMLConverter, ListItemHTMLConverter } from './converters/list'
import { ParagraphHTMLConverter } from './converters/paragraph'
import { QuoteHTMLConverter } from './converters/quote'
import { TextHTMLConverter } from './converters/text'

export const defaultHTMLConverters: HTMLConverter[] = [
  ParagraphHTMLConverter,
  TextHTMLConverter,
  LinebreakHTMLConverter,
  LinkHTMLConverter,
  HeadingHTMLConverter,
  QuoteHTMLConverter,
  ListHTMLConverter,
  ListItemHTMLConverter,
]
