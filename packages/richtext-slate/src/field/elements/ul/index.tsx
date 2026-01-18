import type { RichTextCustomElement } from '../../../types.js'

const name = 'ul'

export const ul: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@ruya.sa/richtext-slate/client#ULElementButton',
  },
  Element: '@ruya.sa/richtext-slate/client#UnorderedListElement',
}
