import type { RichTextCustomElement } from '../../../types.js'

const name = 'h4'

export const h4: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@payloadcms/richtext-slate/client#H4ElementButton',
  },
  Element: '@payloadcms/richtext-slate/client#Heading4Element',
}
