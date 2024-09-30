import type { RichTextCustomElement } from '../../../types.js'

const name = 'blockquote'

export const blockquote: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@payloadcms/richtext-slate/client#BlockquoteElementButton',
  },
  Element: '@payloadcms/richtext-slate/client#BlockquoteElement',
}
