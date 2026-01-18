import type { RichTextCustomElement } from '../../../types.js'

const name = 'h2'

export const h2: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@ruya.sa/richtext-slate/client#H2ElementButton',
  },
  Element: '@ruya.sa/richtext-slate/client#Heading2Element',
}
