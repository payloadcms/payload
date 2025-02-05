import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Fruits, Seeds } from './collections/fruits.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [Fruits, Seeds],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({}),
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
