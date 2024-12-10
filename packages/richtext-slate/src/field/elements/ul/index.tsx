import type { RichTextCustomElement } from '../../../types.js'

const name = 'ul'

export const ul: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@payloadcms/richtext-slate/client#ULElementButton',
  },
  Element: '@payloadcms/richtext-slate/client#UnorderedListElement',
}
