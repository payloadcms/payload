import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { mediaSlug } from '../Media'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'jsonField1',
      schema: [
        {
          type: 'object',
          properties: {
            test: {
              enum: ['string to test one'],
            },
          },
        },
      ],
      type: 'json',
    },
    {
      name: 'jsonField2',
      schema: [
        {
          type: 'object',
          properties: {
            test: {
              enum: ['string to test two'],
            },
          },
        },
      ],
      type: 'json',
    },
    {
      name: 'jsonField3',
      schema: [
        {
          type: 'object',
          properties: {
            test: {
              enum: ['string to test three'],
            },
          },
        },
      ],
      type: 'json',
    },
    {
      name: 'associatedMedia',
      access: {
        create: () => true,
        update: () => false,
      },
      relationTo: mediaSlug,
      type: 'upload',
    },
  ],
  slug: postsSlug,
}
