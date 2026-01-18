import type { RichTextCustomElement } from '../../../types.js'

const name = 'h5'

export const h5: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@ruya.sa/richtext-slate/client#H5ElementButton',
  },
  Element: '@ruya.sa/richtext-slate/client#Heading5Element',
}
