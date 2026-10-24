import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { collectionSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'auth-refresh-tokens',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
      user: collectionSlug,
    },
    collections: [
      {
        slug: collectionSlug,
        auth: {
          refreshTokens: true,
        },
        fields: [],
      },
    ],
  },
})
