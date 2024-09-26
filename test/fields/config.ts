import type { CollectionConfig } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import CheckboxFields from './collections/Checkbox/index.js'
import CodeFields from './collections/Code/index.js'
import EmailFields from './collections/Email/index.js'
import TextFields from './collections/Text/index.js'
// import Uploads3 from './collections/Uploads3/index.js'
// import TabsWithRichText from './globals/TabsWithRichText.js'
import { clearAndSeedEverything } from './seed.js'

export const collectionSlugs: CollectionConfig[] = [
  // LexicalFields,
  // LexicalMigrateFields,
  // LexicalLocalizedFields,
  {
    slug: 'users',
    admin: {
      useAsTitle: 'email',
    },
    auth: true,
    fields: [
      {
        name: 'canViewConditionalField',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
  },
  // ArrayFields,
  // BlockFields,
  CheckboxFields,
  CodeFields,
  // CollapsibleFields,
  // ConditionalLogic,
  // DateFields,
  EmailFields,
  // RadioFields,
  // GroupFields,
  // RowFields,
  // IndexedFields,
  // JSONFields,
  // NumberFields,
  // PointFields,
  // RelationshipFields,
  // // LexicalRelationshipsFields,
  // // RichTextFields,
  // SelectFields,
  // TabsFields2,
  // TabsFields,
  TextFields,
  // Uploads,
  // Uploads2,
  // Uploads3,
  // UploadsMulti,
  // UploadsPoly,
  // UploadsMultiPoly,
  // UIFields,
]

export default buildConfigWithDefaults({
  collections: collectionSlugs,
  // globals: [TabsWithRichText],
  custom: {
    client: {
      'new-value': 'client available',
    },
    server: {
      'new-server-value': 'only available on server',
    },
  },
  editor: null,
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      // afterNavLinks: ['/components/AfterNavLinks.js#AfterNavLinks'],
    },
    custom: {
      client: {
        'new-value': 'client available',
      },
    },
  },
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es'],
  },
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      // await clearAndSeedEverything(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
