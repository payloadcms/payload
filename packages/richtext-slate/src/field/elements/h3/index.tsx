import type { RichTextCustomElement } from '../../../types.js'

const name = 'h3'

export const h3: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@ruya.sa/richtext-slate/client#H3ElementButton',
  },
  Element: '@ruya.sa/richtext-slate/client#Heading3Element',
}
