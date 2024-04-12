import type { HTMLConverter } from './types'

import { AlignHTMLConverter } from './converters/align'
import { HeadingHTMLConverter } from './converters/heading'
import { IndentHTMLConverter } from './converters/indent'
import { LinebreakHTMLConverter } from './converters/linebreak'
import { LinkHTMLConverter } from './converters/link'
import { ListHTMLConverter, ListItemHTMLConverter } from './converters/list'
import { ParagraphHTMLConverter } from './converters/paragraph'
import { QuoteHTMLConverter } from './converters/quote'
import { TextHTMLConverter } from './converters/text'

export const defaultHTMLConverters: HTMLConverter[] = [
  AlignHTMLConverter,
  IndentHTMLConverter,
  ParagraphHTMLConverter,
  TextHTMLConverter,
  LinebreakHTMLConverter,
  LinkHTMLConverter,
  HeadingHTMLConverter,
  QuoteHTMLConverter,
  ListHTMLConverter,
  ListItemHTMLConverter,
]
