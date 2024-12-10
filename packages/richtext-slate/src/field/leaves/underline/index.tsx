import type { RichTextCustomLeaf } from '../../../types.js'

export const underline: RichTextCustomLeaf = {
  name: 'underline',
  Button: '@payloadcms/richtext-slate/client#UnderlineLeafButton',
  Leaf: '@payloadcms/richtext-slate/client#UnderlineLeaf',
}
