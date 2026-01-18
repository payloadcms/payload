import type { RichTextCustomElement } from '../../../types.js'

const name = 'h2'

export const h2: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@payloadcms/richtext-slate/client#H2ElementButton',
  },
  Element: '@payloadcms/richtext-slate/client#Heading2Element',
}
