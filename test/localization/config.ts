import { mapAsync } from '../../src/utilities/mapAsync';
import { buildConfig } from '../buildConfig';

export const slug = 'localized-posts';

export interface LocalizedPost {
  id: string
  title: string,
  description: string
}

export default buildConfig({
  localization: {
    locales: [
      'en',
      'es',
    ],
    defaultLocale: 'en',
  },
  collections: [{
    slug,
    access: {
      read: () => true,
      create: () => true,
      delete: () => true,
      update: () => true,
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        localized: true,
      },
      {
        name: 'description',
        type: 'text',
      },
    ],
  }],
  onInit: async (payload) => {
    await mapAsync([...Array(11)], async () => {
      await payload.create<LocalizedPost>({
        collection: slug,
        data: {
          title: 'title',
          description: 'description',
        },
      });
    });
  },
});
