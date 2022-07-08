import { buildConfig } from '../buildConfig';

export const slug = 'posts';

export interface Post {
  id: string,
  title: string,
  description: string,
  createdAt: Date,
  updatedAt: Date,
}

export default buildConfig({
  collections: [{
    slug,
    fields: [
      {
        name: 'title',
        type: 'text',
      },
      {
        name: 'description',
        type: 'text',
      },
    ],
  }],
  onInit: async (payload) => {
    await payload.create({
      collection: slug,
      data: {
        title: 'title',
        description: 'description',
      },
    });
  },
});
