import type { RichTextCustomElement } from '../../../types.js'

const name = 'h4'

export const h4: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@ruya.sa/richtext-slate/client#H4ElementButton',
  },
  Element: '@ruya.sa/richtext-slate/client#Heading4Element',
}
