import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'
import { he } from '@payloadcms/translations/languages/he'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { type Config } from 'payload'

import { LexicalFullyFeatured } from './collections/_LexicalFullyFeatured/index.js'
import ArrayFields from './collections/Array/index.js'
import {
  getLexicalFieldsCollection,
  lexicalBlocks,
  lexicalInlineBlocks,
} from './collections/Lexical/index.js'
import { LexicalAccessControl } from './collections/LexicalAccessControl/index.js'
import { LexicalHeadingFeature } from './collections/LexicalHeadingFeature/index.js'
import { LexicalInBlock } from './collections/LexicalInBlock/index.js'
import { LexicalJSXConverter } from './collections/LexicalJSXConverter/index.js'
import { LexicalLinkFeature } from './collections/LexicalLinkFeature/index.js'
import { LexicalListsFeature } from './collections/LexicalListsFeature/index.js'
import { LexicalLocalizedFields } from './collections/LexicalLocalized/index.js'
import { LexicalMigrateFields } from './collections/LexicalMigrate/index.js'
import { LexicalObjectReferenceBugCollection } from './collections/LexicalObjectReferenceBug/index.js'
import { LexicalRelationshipsFields } from './collections/LexicalRelationships/index.js'
import { OnDemandForm } from './collections/OnDemandForm/index.js'
import { OnDemandOutsideForm } from './collections/OnDemandOutsideForm/index.js'
import RichTextFields from './collections/RichText/index.js'
import TextFields from './collections/Text/index.js'
import { Uploads, Uploads2 } from './collections/Upload/index.js'
import TabsWithRichText from './globals/TabsWithRichText.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const baseConfig: Partial<Config> = {
  // ...extend config here
  collections: [
    LexicalFullyFeatured,
    LexicalLinkFeature,
    LexicalListsFeature,
    LexicalHeadingFeature,
    LexicalJSXConverter,
    getLexicalFieldsCollection({
      blocks: lexicalBlocks,
      inlineBlocks: lexicalInlineBlocks,
    }),
    LexicalMigrateFields,
    LexicalLocalizedFields,
    LexicalObjectReferenceBugCollection,
    LexicalInBlock,
    LexicalAccessControl,
    LexicalRelationshipsFields,
    RichTextFields,
    TextFields,
    Uploads,
    Uploads2,
    ArrayFields,
    OnDemandForm,
    OnDemandOutsideForm,
  ],
  globals: [TabsWithRichText],

  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      views: {
        custom: {
          Component: './components/Image.js#Image',
          path: '/custom-image',
        },
      },
      beforeDashboard: [
        {
          path: './components/CollectionsExplained.js#CollectionsExplained',
        },
      ],
    },
  },
  onInit: async (payload) => {
    // IMPORTANT: This should only seed, not clear the database.
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await seed(payload)
    }
  },
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'he'],
  },
  i18n: {
    supportedLanguages: {
      en,
      es,
      he,
    },
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
}
