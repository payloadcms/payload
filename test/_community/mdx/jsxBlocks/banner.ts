import type { Block } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { bannerTypes } from '../../collections/Posts/shared.js'

export const BannerBlock: Block = {
  slug: 'Banner',
  jsx: {
    import: ({ props, children, markdownToLexical }) => {
      return {
        type: props?.type,
        content: markdownToLexical({ markdown: children }),
      }
    },
    export: ({ fields, lexicalToMarkdown }) => {
      return {
        props: {
          type: fields.type,
        },
        children: lexicalToMarkdown({ editorState: fields.content }),
      }
    },
  },
  fields: [
    {
      type: 'select',
      name: 'type',
      options: Object.entries(bannerTypes).map(([key, value]) => ({
        label: value,
        value: key,
      })),
      defaultValue: 'info',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor(),
    },
  ],
}
