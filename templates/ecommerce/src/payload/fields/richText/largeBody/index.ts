import type { RichTextCustomElement } from 'payload/types'

import Button from './Button'
import Element from './Element'
import withLargeBody from './plugin'

const richTextLargeBody: RichTextCustomElement = {
  name: 'large-body',
  Button,
  Element,
  plugins: [withLargeBody],
}

export default richTextLargeBody
