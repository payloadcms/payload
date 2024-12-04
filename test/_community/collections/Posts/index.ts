import type { CollectionConfig } from 'payload'

import { BlocksFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

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
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: [
          FixedToolbarFeature(),
          BlocksFeature({
            inlineBlocks: [
              {
                slug: 'inline-media',
                fields: [
                  {
                    name: 'relationship',
                    type: 'relationship',
                    relationTo: ['media'],
                    hasMany: false,
                  },
                ],
                admin: {
                  components: {
                    Label: './collections/Posts/CustomInlineBlockLabel#CustomInlineBlockLabel',
                  },
                },
              },
            ],
          }),
        ],
      }),
    },
  ],
  versions: {
    drafts: true,
  },
}
