import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../../../../../buildConfigWithDefaults.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** A tiny real Payload config the runtime eval boots in-memory. */
export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
  ],
})
