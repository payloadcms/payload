import type { RichTextCustomElement } from '../../../types.d.ts'

import { LinkButton } from './Button/index.js'
import { LinkElement } from './Element/index.js'
import { WithLinks } from './WithLinks.js'

const link: RichTextCustomElement = {
  name: 'link',
  Button: LinkButton,
  Element: LinkElement,
  plugins: [WithLinks],
}

export default link
