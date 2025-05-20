import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Drafts } from './collections/Drafts/index.js'
import { Media } from './collections/Media/index.js'
import { Posts } from './collections/Posts/index.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  folders: {
    enabled: true,
    collections: {
      posts: {},
      media: {},
    },
    // debug: true,
  },
  collections: [Posts, Media, Drafts],
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
  // onInit: seed,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
