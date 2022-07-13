import { buildConfig } from '../buildConfig';

export interface Post {
  id: string;
  title: string;
  description?: string;
  number?: number;
  categoryField?: Category | string
}

export interface Category {
  id: string
  name: string
}

const openAccess = {
  create: () => true,
  read: () => true,
  update: () => true,
  delete: () => true,
};

const categorySlug = 'category';
export default buildConfig({
  collections: [
    {
      slug: 'posts',
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'text',
        },
        {
          name: 'number',
          type: 'number',
        },
        {
          name: 'categoryField',
          type: 'relationship',
          relationTo: categorySlug,
        },
      ],
    },
    {
      slug: categorySlug,
      access: openAccess,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],
});
