import type { RichTextCustomElement } from '../../../types.js'

export const link: RichTextCustomElement = {
  name: 'link',
  Button: '@payloadcms/richtext-slate/client#LinkButton',
  Element: '@payloadcms/richtext-slate/client#LinkElement',
  plugins: ['@payloadcms/richtext-slate/client#WithLinks'],
}
