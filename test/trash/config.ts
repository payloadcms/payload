import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { DifferentiatedTrashCollection } from './collections/DifferentiatedTrashCollection/index.js'
import { Pages } from './collections/Pages/index.js'
import { Posts } from './collections/Posts/index.js'
import { Registrations } from './collections/Registrations/index.js'
import { RestrictedCollection } from './collections/RestrictedCollection/index.js'
import { Users } from './collections/Users/index.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'trash',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      Pages,
      Posts,
      Registrations,
      RestrictedCollection,
      DifferentiatedTrashCollection,
      Users,
    ],
    editor: lexicalEditor({}),
    localization: {
      defaultLocale: 'en',
      locales: ['en', 'es'],
    },

    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed,
})
