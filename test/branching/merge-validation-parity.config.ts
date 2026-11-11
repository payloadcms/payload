import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { buildMergeValidationFields, MergeValidation } from './collections/MergeValidation.js'
import { mergeValidationGlobalSlug } from './shared.js'

export default buildConfigWithDefaults({
  config: {
    branching: true,
    collections: [MergeValidation],
    globals: [
      {
        slug: mergeValidationGlobalSlug,
        fields: buildMergeValidationFields(),
        versions: { drafts: true },
      },
    ],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
    typescript: { autoGenerate: false },
  },
  suite: 'branching',
})
