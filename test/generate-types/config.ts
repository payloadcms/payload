import { Config } from '../../src/config/types';
import { buildConfig } from '../buildConfig';

const config: Config = {
  collections: [
    {
      slug: 'books',
      fields: [
        {
          name: 'title',
          type: 'text',
          custom: { description: 'The title of this page' },
        },
        {
          type: 'row',
          fields: [
            { type: 'checkbox', name: 'isPublished' },
            { type: 'select', name: 'type', options: [{ label: 'Thriller', value: 'thriller' }] },
          ],
        },
        {
          type: 'relationship',
          name: 'author',
          relationTo: 'authors',
          hasMany: false,
        },
      ],
    },
    {
      slug: 'authors',
      fields: [
        {
          type: 'text',
          name: 'name',
        },
        {
          type: 'relationship',
          name: 'address',
          relationTo: 'addresses',
          hasMany: false,
        },
      ],
    },
    {
      slug: 'addresses',
      fields: [
        {
          name: 'address',
          type: 'text',
        },
      ],
      custom: { externalLink: 'https://foo.bar' },
    },
  ],
};

export default buildConfig(config);
