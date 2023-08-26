import { buildConfigWithDefaults } from '../buildConfigWithDefaults';
import { LocalizedArrays } from './collections/LocalizedArrays';
import { LocalizedBlocks } from './collections/LocalizedBlocks';
import { LocalizedGroups } from './collections/LocalizedGroups';
import { Posts } from './collections/Posts';
import { seedComplexDocs } from './seed/complexDocs';
import { seedLocalizedArrays } from './seed/localizedArrays';
import { seedLocalizedBlocks } from './seed/localizedBlocks';
import { seedLocalizedGroups } from './seed/localizedGroups';

const config = buildConfigWithDefaults({
  collections: [
    // LocalizedArrays,
    // LocalizedBlocks,
    // LocalizedGroups,
    Posts,
    {
      slug: 'pages',
      fields: [
        {
          name: 'slug',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      slug: 'people',
      fields: [
        {
          name: 'fullName',
          type: 'text',
        },
      ],
    },
  ],
  localization: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
  onInit: async (payload) => {
    await seedComplexDocs(payload);
    // await seedLocalizedGroups(payload);
    // await seedLocalizedArrays(payload);
    // await seedLocalizedBlocks(payload);
  },
});

export default config;
