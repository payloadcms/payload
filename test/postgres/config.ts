import { buildConfigWithDefaults } from '../buildConfigWithDefaults';
import { LocalizedArrays } from './collections/LocalizedArrays';
import { LocalizedBlocks } from './collections/LocalizedBlocks';
import { LocalizedGroups } from './collections/LocalizedGroups';
import { Posts } from './collections/Posts';
import { MainMenu } from './globals/MainMenu';

const config = buildConfigWithDefaults({
  collections: [
    LocalizedArrays,
    LocalizedBlocks,
    LocalizedGroups,
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
  globals: [
    MainMenu,
  ],
  localization: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
});

export default config;
