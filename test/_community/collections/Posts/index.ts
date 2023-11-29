import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { mediaSlug } from '../Media'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    defaultColumns: [
      'text0',
      'text1',
      'text2',
      'text3',
      'text4',
      'text5',
      'text6',
      'text7',
      'text8',
      'text9',
      'text10',
      'text11',
      'text12',
      'text13',
      'text14',
      'text15',
      'text16',
      'text17',
      'text18',
      'text19',
    ],
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    // add 20 more text fields with unique names
    ...Array.from(Array(20).keys()).map((i) => ({
      name: `text${i}`,
      type: 'text',
    })),
    {
      name: 'associatedMedia',
      type: 'upload',
      relationTo: mediaSlug,
      access: {
        create: () => true,
        update: () => false,
      },
    },
  ],
}
