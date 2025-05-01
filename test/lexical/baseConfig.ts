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
import { LexicalInBlock } from './collections/LexicalInBlock/index.js'
import { LexicalLocalizedFields } from './collections/LexicalLocalized/index.js'
import { LexicalMigrateFields } from './collections/LexicalMigrate/index.js'
import { LexicalObjectReferenceBugCollection } from './collections/LexicalObjectReferenceBug/index.js'
import { LexicalRelationshipsFields } from './collections/LexicalRelationships/index.js'
import RichTextFields from './collections/RichText/index.js'
import TextFields from './collections/Text/index.js'
import Uploads from './collections/Upload/index.js'
import TabsWithRichText from './globals/TabsWithRichText.js'
import { clearAndSeedEverything } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const baseConfig: Partial<Config> = {
  // ...extend config here
  collections: [
    LexicalFullyFeatured,
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
    ArrayFields,
  ],
  globals: [TabsWithRichText],

  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeDashboard: [
        {
          path: './components/CollectionsExplained.tsx#CollectionsExplained',
        },
      ],
    },
  },
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await clearAndSeedEverything(payload)
    }
  },
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es'],
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
}
