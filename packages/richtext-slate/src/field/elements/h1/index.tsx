import type { RichTextCustomElement } from '../../../types.js'

const name = 'h1'

export const h1: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@payloadcms/richtext-slate/client#H1ElementButton',
  },
  Element: '@payloadcms/richtext-slate/client#Heading1Element',
}
