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
      name: 'json',
      schema: [
        {
          type: 'object',
          properties: {
            test: {
              enum: ['string to test ok', 'ok', 'still ok'],
            },
          },
        },
      ],
      type: 'json',
    },
    {
      name: 'json2',
      schema: [
        {
          type: 'object',
          properties: {
            test: {
              enum: ['strings to test ok'],
            },
          },
        },
      ],
      type: 'json',
    },
    {
      name: 'json3',
      schema: [
        {
          type: 'object',
          properties: {
            test: {
              enum: ['strings to test ok'],
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
