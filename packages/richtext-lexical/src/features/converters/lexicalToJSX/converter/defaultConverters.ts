import type { DefaultNodeTypes } from '../../../../nodeTypes.js'
import type { JSXConverters } from './types.js'

import { BlockquoteJSXConverter } from './converters/blockquote.js'
import { HeadingJSXConverter } from './converters/heading.js'
import { HorizontalRuleJSXConverter } from './converters/horizontalRule.js'
import { LinebreakJSXConverter } from './converters/linebreak.js'
import { LinkJSXConverter } from './converters/link.js'
import { ListJSXConverter } from './converters/list.js'
import { ParagraphJSXConverter } from './converters/paragraph.js'
import { TabJSXConverter } from './converters/tab.js'
import { TableJSXConverter } from './converters/table.js'
import { TextJSXConverter } from './converters/text.js'
import { UploadJSXConverter } from './converters/upload.js'

export const defaultJSXConverters: JSXConverters<DefaultNodeTypes> = {
  ...ParagraphJSXConverter,
  ...TextJSXConverter,
  ...LinebreakJSXConverter,
  ...BlockquoteJSXConverter,
  ...TableJSXConverter,
  ...HeadingJSXConverter,
  ...HorizontalRuleJSXConverter,
  ...ListJSXConverter,
  ...LinkJSXConverter({}),
  ...UploadJSXConverter,
  ...TabJSXConverter,
}
