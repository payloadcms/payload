import { buildConfig } from '../buildConfig';

export interface Post {
  id: string
  title: string
  description?: string
  number?: number
}

export default buildConfig({
  collections: [{
    slug: 'posts',
    access: {
      create: () => true,
      read: () => true,
      update: () => true,
      delete: () => true,
    },
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
    ],
  }],
});
