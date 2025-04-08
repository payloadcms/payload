/* eslint-disable no-restricted-exports */
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
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
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
