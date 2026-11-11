import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

export const nestedCategoriesSlug = 'nested-categories'

export default buildConfigWithDefaults({
  config: {
    branching: true,
    collections: [
      {
        slug: nestedCategoriesSlug,
        admin: { useAsTitle: 'title' },
        fields: [{ name: 'title', type: 'text', required: true }],
      },
    ],
    localization: { defaultLocale: 'en', locales: ['en', 'es'] },
    plugins: [nestedDocsPlugin({ collections: [nestedCategoriesSlug] })],
  },
  suite: 'branching',
})
