import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Autosave } from './collections/Autosave/index.js'
import { Drafts } from './collections/Drafts/index.js'
import { Media } from './collections/Media/index.js'
import { Posts } from './collections/Posts/index.js'
import { seed } from './seed/index.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  folders: {
    // debug: true,
  },
  collections: [Posts, Media, Drafts, Autosave],
  globals: [
    {
      slug: 'global',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
    // await seed(payload)
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
