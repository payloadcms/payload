import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { nestedPagesSlug } from './shared.js'

export default buildConfigWithDefaults({
  config: {
    branching: true,
    collections: [
      {
        slug: nestedPagesSlug,
        fields: [
          { name: 'title', type: 'text', localized: true, required: true },
          {
            name: 'layout',
            type: 'blocks',
            localized: true,
            blocks: [
              {
                slug: 'content',
                fields: [
                  { name: 'heading', type: 'text' },
                  {
                    name: 'items',
                    type: 'array',
                    fields: [{ name: 'label', type: 'text' }],
                  },
                ],
              },
            ],
          },
        ],
        versions: { drafts: { autosave: true } },
      },
    ],
    typescript: { autoGenerate: false },
    localization: { defaultLocale: 'en', locales: ['en', 'es'] },
  },
  suite: 'branching',
})
