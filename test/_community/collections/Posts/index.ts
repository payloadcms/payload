import type { CollectionConfig } from '../../../../src/collections/config/types';
import { mediaSlug } from '../Media';


export const postsSlug = 'posts';

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  hooks: {
    beforeChange: [
      (props) => {
        return {
          afterChange: async (afterChangeProps) => {
            console.log('afterChange', afterChangeProps?.doc?.id);
          },
          ...props.data,
        };
      },
    ],
  },
  fields: [
    {
      name: 'multinumber',
      type: 'number',
      hasMany: true,
    },
    {
      name: 'select',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'One', value: 'one' },
        { label: 'Two', value: 'two' },
      ],
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'number',
          type: 'number',
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
