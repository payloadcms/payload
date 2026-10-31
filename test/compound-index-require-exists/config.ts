import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { ArrayFilteredPosts } from './collections/ArrayFilteredPosts.js'
import { LocalizedPosts } from './collections/LocalizedPosts.js'
import { Posts } from './collections/Posts.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfigWithDefaults({
  config: {
    collections: [Posts, LocalizedPosts, ArrayFilteredPosts],
    localization: { defaultLocale: 'en', locales: ['en', 'de'] },
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  },
  disableMCP: true,
  suite: 'compound-index-require-exists',
})
