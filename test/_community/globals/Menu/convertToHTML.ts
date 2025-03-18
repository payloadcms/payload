import type { SerializedLinkNode } from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import {
  convertLexicalToHTML,
  type HTMLConvertersFunction,
  LinkHTMLConverter,
} from '@payloadcms/richtext-lexical/html'

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { relationTo, value } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  return relationTo === 'glossary' ? `/glossar/${slug}` : `/${slug}`
}

const htmlConverters: HTMLConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkHTMLConverter({ internalDocToHref }),
})

export const convertToHtml = (content: SerializedEditorState) => {
  const html = convertLexicalToHTML({
    converters: htmlConverters,
    data: content,
  })
  return html
}
