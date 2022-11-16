import { CollectionConfig } from 'payload/types';

const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [{
        label: 'Content',
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true
          },
          {
            name: 'excerpt',
            type: 'text',
          },
          {
            name: 'slug',
            type: 'text',
            required: true,
            admin: {
              position: 'sidebar',
            }
          },
        ]
      }]
    }
  ],
}

export default Posts;
