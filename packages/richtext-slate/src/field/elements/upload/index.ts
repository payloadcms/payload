import type { RichTextCustomElement } from '../../..'

import Button from './Button'
import Element from './Element'
import { WithUpload } from './plugin'
import { uploadName } from './shared'

const upload: RichTextCustomElement = {
  name: uploadName,
  Button,
  Element,
  plugins: [WithUpload],
}

export default upload
