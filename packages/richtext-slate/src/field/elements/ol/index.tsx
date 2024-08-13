import type { RichTextCustomElement } from '../../../types.js'

const name = 'ol'

export const ol: RichTextCustomElement = {
  name,
  Button: {
    clientProps: {
      format: name,
    },
    path: '@payloadcms/richtext-slate/client#OLElementButton',
  },
  Element: '@payloadcms/richtext-slate/client#OrderedListElement',
}
