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
      name: 'text',
      type: 'text',
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
