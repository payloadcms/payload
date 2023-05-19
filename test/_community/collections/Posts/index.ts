import type { CollectionConfig } from '../../../../src/collections/config/types';
import { mediaSlug } from '../Media';

export const postsSlug = 'posts';

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      type: 'group',
      name: 'testGroup',
      fields: [
        {
          type: 'row',
          fields: [
            {
              type: 'text',
              name: 'textInRowInGroup',
              defaultValue: 'textInRowInGroup',
            },
          ],
        },
        {
          type: 'text',
          name: 'textInGroup',
          defaultValue: 'textInGroup',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          type: 'text',
          name: 'textInRow',
          defaultValue: 'textInRow',
        },
      ],
    },
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
};
