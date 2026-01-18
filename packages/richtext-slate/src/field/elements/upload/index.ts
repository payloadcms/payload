import type { RichTextCustomElement } from '../../../types.js'

import { uploadName } from './shared.js'

export const upload: RichTextCustomElement = {
  name: uploadName,
  Button: '@ruya.sa/richtext-slate/client#UploadElementButton',
  Element: '@ruya.sa/richtext-slate/client#UploadElement',
  plugins: ['@ruya.sa/richtext-slate/client#WithUpload'],
}
