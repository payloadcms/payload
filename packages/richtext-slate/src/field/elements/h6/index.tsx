import type { RichTextCustomElement } from '../../../types.js'

const name = 'h6'

export const h6: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@ruya.sa/richtext-slate/client#H6ElementButton',
  },
  Element: '@ruya.sa/richtext-slate/client#Heading6Element',
}
