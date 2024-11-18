import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
  ParagraphFeature,
  TreeViewFeature,
} from '@payloadcms/richtext-lexical'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: [
          InlineToolbarFeature(),
          ParagraphFeature(),
          FixedToolbarFeature(),
          BlocksFeature({
            wrapperBlocks: [
              {
                block: {
                  slug: 'textBlock',
                  fields: [
                    {
                      name: 'text',
                      type: 'text',
                    },
                  ],
                },
                createDOM: './collections/Posts/createDOM.js#createDOM',
              },
            ],
          }),
          TreeViewFeature(),
        ],
      }),
    },
  ],
  versions: {
    drafts: true,
  },
}
