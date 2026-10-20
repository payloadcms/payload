import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { AllHidden, HiddenFields } from './collections/index.js'
import { hiddenFields } from './fields.js'
import { allHiddenGlobalSlug, hiddenGlobalSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfigWithDefaults({
  suite: 'graphql-hidden-fields',
  config: {
    collections: [HiddenFields, AllHidden],
    globals: [
      {
        slug: hiddenGlobalSlug,
        access: { read: () => true, update: () => true },
        fields: hiddenFields,
        graphQL: { name: 'HiddenGlobal' },
        versions: false,
      },
      {
        slug: allHiddenGlobalSlug,
        authorship: false,
        access: { read: () => true, update: () => true },
        fields: [{ name: 'secret', type: 'text', hidden: true, defaultValue: 'internal' }],
        graphQL: { name: 'AllHiddenGlobal' },
        versions: false,
      },
    ],
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  },
})
