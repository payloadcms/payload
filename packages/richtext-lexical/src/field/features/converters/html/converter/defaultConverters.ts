import type { HTMLConverter } from './types'

import { AlignHTMLConverter } from './converters/align'
import { IndentHTMLConverter } from './converters/indent'
import { LinebreakHTMLConverter } from './converters/linebreak'
import { ParagraphHTMLConverter } from './converters/paragraph'
import { TextHTMLConverter } from './converters/text'

export const defaultHTMLConverters: HTMLConverter[] = [
  AlignHTMLConverter,
  IndentHTMLConverter,
  ParagraphHTMLConverter,
  TextHTMLConverter,
  LinebreakHTMLConverter,
]
