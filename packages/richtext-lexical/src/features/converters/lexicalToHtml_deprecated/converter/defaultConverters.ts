import type { HTMLConverter } from './types.js'

import { LinebreakHTMLConverter } from './converters/linebreak.js'
import { ParagraphHTMLConverter } from './converters/paragraph.js'
import { TabHTMLConverter } from './converters/tab.js'
import { TextHTMLConverter } from './converters/text.js'

/**
 * @deprecated - will be removed in 4.0
 */
export const defaultHTMLConverters: HTMLConverter<any>[] = [
  ParagraphHTMLConverter,
  TextHTMLConverter,
  LinebreakHTMLConverter,
  TabHTMLConverter,
]
