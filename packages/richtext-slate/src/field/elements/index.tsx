import type { RichTextCustomElement } from '../../types.js'

import { blockquote } from './blockquote/index.js'
import { h1 } from './h1/index.js'
import { h2 } from './h2/index.js'
import { h3 } from './h3/index.js'
import { h4 } from './h4/index.js'
import { h5 } from './h5/index.js'
import { h6 } from './h6/index.js'
import { indent } from './indent/index.js'
import { li } from './li/index.js'
import { link } from './link/index.js'
import { ol } from './ol/index.js'
import { relationship } from './relationship/index.js'
import { textAlign } from './textAlign/index.js'
import { ul } from './ul/index.js'
import { upload } from './upload/index.js'

export const elements: Record<string, RichTextCustomElement> = {
  blockquote,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  indent,
  li,
  link,
  ol,
  relationship,
  textAlign,
  ul,
  upload,
}
