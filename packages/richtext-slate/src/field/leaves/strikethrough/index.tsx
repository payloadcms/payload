import type { RichTextCustomLeaf } from '../../../types.js'

export const strikethrough: RichTextCustomLeaf = {
  name: 'strikethrough',
  Button: '@payloadcms/richtext-slate/client#StrikethroughLeafButton',
  Leaf: '@payloadcms/richtext-slate/client#StrikethroughLeaf',
}
