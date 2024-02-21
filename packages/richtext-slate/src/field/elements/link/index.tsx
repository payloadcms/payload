import type { RichTextCustomElement } from '../../..'

import { LinkButton } from './Button'
import { LinkElement } from './Element'
import { withLinks } from './utilities'

const link: RichTextCustomElement = {
  name: 'link',
  Button: LinkButton,
  Element: LinkElement,
  plugins: [withLinks],
}

export default link
