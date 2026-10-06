import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Categories } from './collections/Categories.js'
import { Pages } from './collections/Pages.js'
import { pagesSlug } from './shared.js'

export default buildConfigWithDefaults({
  suite: 'nested-docs-all-locales',
  config: {
    typescript: { autoGenerate: false },
    collections: [
      {
        ...Pages,
        access: { create: () => true, read: () => true, update: () => true },
        fields: Pages.fields.map((field) =>
          'name' in field && ['slug', 'title'].includes(field.name)
            ? { ...field, localized: true }
            : field,
        ),
        versions: { drafts: { localizeStatus: true } },
      },
      {
        ...Categories,
        access: { create: () => true, read: () => true, update: () => true },
        fields: Categories.fields.map((field) =>
          'name' in field && field.name === 'name' ? { ...field, localized: true } : field,
        ),
      },
    ],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
    plugins: [
      nestedDocsPlugin({
        collections: [pagesSlug],
        generateLabel: (_, doc) => doc.title as string,
        generateURL: (docs) => docs.map((doc) => `/${doc.slug as string}`).join(''),
      }),
      nestedDocsPlugin({
        collections: ['categories'],
        breadcrumbsFieldSlug: 'categorization',
        parentFieldSlug: 'owner',
        generateLabel: (_, doc) => doc.name as string,
        generateURL: (docs) => docs.map((doc) => `/${doc.name as string}`).join(''),
      }),
    ],
  },
})
