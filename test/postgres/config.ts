import { buildConfigWithDefaults } from '../buildConfigWithDefaults';
import { LocalizedArrays } from './collections/LocalizedArrays';
import { LocalizedBlocks } from './collections/LocalizedBlocks';
import { LocalizedGroups } from './collections/LocalizedGroups';
import { Pages } from './collections/Pages';
import { People } from './collections/People';
import { Posts } from './collections/Posts';
import { MainMenu } from './globals/MainMenu';

const config = buildConfigWithDefaults({
  collections: [
    LocalizedArrays,
    LocalizedBlocks,
    LocalizedGroups,
    Pages,
    People,
    Posts,
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
