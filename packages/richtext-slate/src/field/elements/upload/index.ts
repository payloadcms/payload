import type { RichTextCustomElement } from '../../../types.d.ts'

import { Button } from './Button/index.js'
import { Element } from './Element/index.js'
import { WithUpload } from './plugin.js'
import { uploadName } from './shared.js'

export const upload: RichTextCustomElement = {
  name: uploadName,
  Button,
  Element,
  plugins: [WithUpload],
}
