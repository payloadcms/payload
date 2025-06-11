import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser, regularUser } from '../credentials.js'
import { TrashEnabled } from './collections/TrashEnabled/index.js'
import { TrashEnabledWithAccessControl } from './collections/TrashEnabledWithAccessControl/index.js'
import { Users } from './collections/Users/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// eslint-disable-next-line no-restricted-exports
export default buildConfigWithDefaults({
  collections: [TrashEnabled, TrashEnabledWithAccessControl, Users],
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
        name: 'Admin',
        roles: ['is_admin', 'is_user'],
      },
    })

    await payload.create({
      collection: 'users',
      data: {
        email: regularUser.email,
        password: regularUser.password,
        name: 'Dev',
        roles: ['is_user'],
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
