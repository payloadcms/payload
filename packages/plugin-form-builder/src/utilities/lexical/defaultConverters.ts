import type { HTMLConverter } from './types.js'

import { HeadingHTMLConverter } from './converters/heading.js'
import { LinebreakHTMLConverter } from './converters/linebreak.js'
import { LinkHTMLConverter } from './converters/link.js'
import { ListHTMLConverter, ListItemHTMLConverter } from './converters/list.js'
import { ParagraphHTMLConverter } from './converters/paragraph.js'
import { QuoteHTMLConverter } from './converters/quote.js'
import { TextHTMLConverter } from './converters/text.js'

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
