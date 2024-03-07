import type { RichTextCustomElement } from '../../../types.js'

import { LinkButton } from './Button/index.js'
import { LinkElement } from './Element/index.js'
import { WithLinks } from './WithLinks.js'

export const link: RichTextCustomElement = {
  name: 'link',
  Button: LinkButton,
  Element: LinkElement,
  plugins: [WithLinks],
}
