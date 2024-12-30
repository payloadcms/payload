import type { HTMLConverter } from './types.js'

import { LinebreakHTMLConverter } from './converters/linebreak.js'
import { ParagraphHTMLConverter } from './converters/paragraph.js'
import { TextHTMLConverter } from './converters/text.js'

export const defaultHTMLConverters: HTMLConverter<any>[] = [
  ParagraphHTMLConverter,
  TextHTMLConverter,
  LinebreakHTMLConverter,
]
