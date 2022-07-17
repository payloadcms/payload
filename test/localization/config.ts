import { mapAsync } from '../../src/utilities/mapAsync';
import { buildConfig } from '../buildConfig';
import { LocalizedPost } from './payload-types';
import { englishTitle, spanishLocale, spanishTitle } from './shared';

export type LocalizedPostAllLocale = LocalizedPost & {
  title: {
    en?: string;
    es?: string;
  };
};

export const slug = 'localized-posts';

export default buildConfig({
  localization: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
  collections: [
    {
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
    },
  ],
  onInit: async (payload) => {
    const collection = slug;

    await payload.create({
      collection,
      data: {
        title: englishTitle,
      },
    });

    const localizedPost = await payload.create<LocalizedPost>({
      collection,
      data: {
        title: englishTitle,
      },
    });

    await payload.update<LocalizedPost>({
      collection,
      id: localizedPost.id,
      locale: spanishLocale,
      data: {
        title: spanishTitle,
      },
    });

    await mapAsync([...Array(11)], async () => {
      await payload.create<LocalizedPost>({
        collection,
        data: {
          title: 'title',
          description: 'description',
        },
      });
    });
  },
});
