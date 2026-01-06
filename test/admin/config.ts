import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { BASE_PATH } from './shared.js'
import { usersCollectionSlug } from './slugs.js'
process.env.NEXT_BASE_PATH = BASE_PATH

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: ['/components/AfterNavLinks/index.js#AfterNavLinks'],
    },
  },
  collections: [
    {
      slug: 'users',
      admin: {
        useAsTitle: 'email',
      },
      auth: true,
      fields: [
        {
          name: 'textField',
          type: 'text',
        },
        {
          name: 'sidebarField',
          type: 'text',
          admin: {
            position: 'sidebar',
          },
        },
      ],
    },
  ],
  globals: [],
  onInit: async (payload) => {
    await payload.create({
      collection: usersCollectionSlug,
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      depth: 0,
      overrideAccess: true,
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
