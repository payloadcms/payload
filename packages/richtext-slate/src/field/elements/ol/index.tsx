import type { RichTextCustomElement } from '../../../types.js'

const name = 'ol'

export const ol: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@ruya.sa/richtext-slate/client#OLElementButton',
  },
  Element: '@ruya.sa/richtext-slate/client#OrderedListElement',
}
