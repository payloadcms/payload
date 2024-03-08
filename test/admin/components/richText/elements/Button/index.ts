import type { RichTextCustomElement } from '../../../../../../packages/richtext-slate/src/types.js'

import { ToolbarButton } from './Button/index.js'
import { ButtonElement } from './Element/index.js'
import { withButton } from './plugin.js'

export const button: RichTextCustomElement = {
  name: 'button',
  Button: ToolbarButton,
  Element: ButtonElement,
  plugins: [withButton],
}
