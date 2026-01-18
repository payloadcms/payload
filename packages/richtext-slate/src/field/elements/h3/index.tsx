import type { RichTextCustomElement } from '../../../types.js'

const name = 'h3'

export const h3: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@payloadcms/richtext-slate/client#H3ElementButton',
  },
  Element: '@payloadcms/richtext-slate/client#Heading3Element',
}
