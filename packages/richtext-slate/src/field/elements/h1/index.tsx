import type { RichTextCustomElement } from '../../../types.js'

const name = 'h1'

export const h1: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@ruya.sa/richtext-slate/client#H1ElementButton',
  },
  Element: '@ruya.sa/richtext-slate/client#Heading1Element',
}
