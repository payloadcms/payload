import type { DefaultNodeTypes } from '../../../../nodeTypes.js'
import type { HTMLConvertersAsync } from './types.js'

import { BlockquoteHTMLConverterAsync } from './converters/blockquote.js'
import { HeadingHTMLConverterAsync } from './converters/heading.js'
import { HorizontalRuleHTMLConverterAsync } from './converters/horizontalRule.js'
import { LinebreakHTMLConverterAsync } from './converters/linebreak.js'
import { LinkHTMLConverterAsync } from './converters/link.js'
import { ListHTMLConverterAsync } from './converters/list.js'
import { ParagraphHTMLConverterAsync } from './converters/paragraph.js'
import { TabHTMLConverterAsync } from './converters/tab.js'
import { TableHTMLConverterAsync } from './converters/table.js'
import { TextHTMLConverterAsync } from './converters/text.js'
import { UploadHTMLConverterAsync } from './converters/upload.js'

export const defaultHTMLConvertersAsync: HTMLConvertersAsync<DefaultNodeTypes> = {
  ...ParagraphHTMLConverterAsync,
  ...TextHTMLConverterAsync,
  ...LinebreakHTMLConverterAsync,
  ...BlockquoteHTMLConverterAsync,
  ...TableHTMLConverterAsync,
  ...HeadingHTMLConverterAsync,
  ...HorizontalRuleHTMLConverterAsync,
  ...ListHTMLConverterAsync,
  ...LinkHTMLConverterAsync({}),
  ...UploadHTMLConverterAsync,
  ...TabHTMLConverterAsync,
}
