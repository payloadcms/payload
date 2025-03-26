import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Pages } from './collections/Pages/index.js'
import { Posts } from './collections/Posts/index.js'
import { Users } from './collections/Users/index.js'
import { roles } from './fields/roles.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  queryPresets: {
    // labels: {
    //   singular: 'Report',
    //   plural: 'Reports',
    // },
    access: {
      read: ({ req: { user } }) =>
        user ? !user?.roles?.some((role) => role === 'anonymous') : false,
      update: ({ req: { user } }) =>
        user ? !user?.roles?.some((role) => role === 'anonymous') : false,
    },
    constraints: {
      read: [
        {
          label: 'Specific Roles',
          value: 'specificRoles',
          fields: [roles],
          access: ({ req: { user } }) => ({
            'access.read.roles': {
              in: user?.roles || [],
            },
          }),
        },
      ],
      update: [
        {
          label: 'Specific Roles',
          value: 'specificRoles',
          fields: [roles],
          access: ({ req: { user } }) => ({
            'access.update.roles': {
              in: user?.roles || [],
            },
          }),
        },
      ],
    },
  },
  collections: [Pages, Users, Posts],
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await seed(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
