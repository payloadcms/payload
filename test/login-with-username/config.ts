import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '@test-utils/buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const LoginWithUsernameConfig = buildConfigWithDefaults({
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  collections: [
    {
      slug: 'users',
      auth: {
        loginWithUsername: {
          requireEmail: false,
          allowEmailLogin: false,
        },
      },
      fields: [],
    },
    {
      slug: 'login-with-either',
      auth: {
        loginWithUsername: {
          requireEmail: false,
          allowEmailLogin: true,
          requireUsername: false,
        },
      },
      fields: [],
    },
  ],
})

export default LoginWithUsernameConfig
