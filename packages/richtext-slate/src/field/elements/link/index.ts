import type { RichTextCustomElement } from '../../..'

import { LinkButton } from './Button'
import { LinkElement } from './Element'
import { WithLinks } from './WithLinks'

const link: RichTextCustomElement = {
  name: 'link',
  Button: LinkButton,
  Element: LinkElement,
  plugins: [WithLinks],
}

export default link
