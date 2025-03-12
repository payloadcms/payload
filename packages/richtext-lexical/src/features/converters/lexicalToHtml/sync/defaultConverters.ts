import type { DefaultNodeTypes } from '../../../../nodeTypes.js'
import type { HTMLConverters } from './types.js'

import { BlockquoteHTMLConverter } from './converters/blockquote.js'
import { HeadingHTMLConverter } from './converters/heading.js'
import { HorizontalRuleHTMLConverter } from './converters/horizontalRule.js'
import { LinebreakHTMLConverter } from './converters/linebreak.js'
import { LinkHTMLConverter } from './converters/link.js'
import { ListHTMLConverter } from './converters/list.js'
import { ParagraphHTMLConverter } from './converters/paragraph.js'
import { TabHTMLConverter } from './converters/tab.js'
import { TableHTMLConverter } from './converters/table.js'
import { TextHTMLConverter } from './converters/text.js'
import { UploadHTMLConverter } from './converters/upload.js'

export const defaultHTMLConverters: HTMLConverters<DefaultNodeTypes> = {
  ...ParagraphHTMLConverter,
  ...TextHTMLConverter,
  ...LinebreakHTMLConverter,
  ...BlockquoteHTMLConverter,
  ...TableHTMLConverter,
  ...HeadingHTMLConverter,
  ...HorizontalRuleHTMLConverter,
  ...ListHTMLConverter,
  ...LinkHTMLConverter({}),
  ...UploadHTMLConverter,
  ...TabHTMLConverter,
}
