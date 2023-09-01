import type { RichTextCustomElement } from '../../../../../../packages/payload/src/fields/config/types'

import Button from './Button'
import Element from './Element'
import plugin from './plugin'

const button: RichTextCustomElement = {
  name: 'button',
  Button,
  Element,
  plugins: [plugin],
}

export default button
