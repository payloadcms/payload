import type { RichTextCustomElement } from '../../../types.js'

import { uploadName } from './shared.js'

export const upload: RichTextCustomElement = {
  name: uploadName,
  Button: '@payloadcms/richtext-slate/client#UploadElementButton',
  Element: '@payloadcms/richtext-slate/client#UploadElement',
  plugins: ['@payloadcms/richtext-slate/client#WithUpload'],
}
