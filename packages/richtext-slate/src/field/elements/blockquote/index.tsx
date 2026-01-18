import type { RichTextCustomElement } from '../../../types.js'

const name = 'blockquote'

export const blockquote: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@ruya.sa/richtext-slate/client#BlockquoteElementButton',
  },
  Element: '@ruya.sa/richtext-slate/client#BlockquoteElement',
}
