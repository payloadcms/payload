import type { Block } from 'payload'

import { BlocksFeature, lexicalEditor, TreeViewFeature } from '@payloadcms/richtext-lexical'

import { bannerTypes } from '../../collections/Posts/shared.js'
import { InlineCodeBlock } from './inlineCode.js'

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
      const props: any = {}
      if (fields.type) {
        props.type = fields.type
      }

      return {
        props,
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
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          TreeViewFeature(),
          BlocksFeature({
            inlineBlocks: [InlineCodeBlock],
          }),
        ],
      }),
    },
  ],
}
