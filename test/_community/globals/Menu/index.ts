import type { HTMLConvertersFunction } from '@payloadcms/richtext-lexical/html'
import type { GlobalConfig } from 'payload'

import { type DefaultNodeTypes, lexicalHTMLField } from '@payloadcms/richtext-lexical'

export const menuSlug = 'menu'

export const MenuGlobal: GlobalConfig = {
  slug: menuSlug,
  fields: [
    {
      name: 'globalText',
      type: 'text',
    },
    {
      name: 'customRichText',
      type: 'richText',
    },
    lexicalHTMLField({
      htmlFieldName: 'customRichText_html',
      lexicalFieldName: 'customRichText',
      // can pass in additional converters or override default ones
      converters: (({ defaultConverters }) => ({
        ...defaultConverters,
      })) as HTMLConvertersFunction<DefaultNodeTypes>,
    }),
  ],
}
