import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  collections: [
    {
      slug: 'users',
      auth: {
        loginWithUsername: {
          requireEmail: false,
          allowEmailLogin: true,
          requireUsername: false,
        },
      },
      fields: [
        {
          name: 'displayName',
          type: 'text',
        },
      ],
    },
  ],
})
