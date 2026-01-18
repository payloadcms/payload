import type { RichTextCustomElement } from '../../../types.js'

export const link: RichTextCustomElement = {
  name: 'link',
  Button: '@ruya.sa/richtext-slate/client#LinkButton',
  Element: '@ruya.sa/richtext-slate/client#LinkElement',
  plugins: ['@ruya.sa/richtext-slate/client#WithLinks'],
}
