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

// eslint-disable-next-line no-restricted-exports
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
      read: ({ req: { user } }) => Boolean(user?.roles?.length && !user?.roles?.includes('user')),
      update: ({ req: { user } }) => Boolean(user?.roles?.length && !user?.roles?.includes('user')),
    },
    filterConstraints: ({ req, options }) =>
      !req.user?.roles?.includes('admin')
        ? options.filter(
            (option) => (typeof option === 'string' ? option : option.value) !== 'onlyAdmins',
          )
        : options,
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
        {
          label: 'Noone',
          value: 'noone',
          access: () => false,
        },
        {
          label: 'Only Admins',
          value: 'onlyAdmins',
          access: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
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
        {
          label: 'Only Admins',
          value: 'onlyAdmins',
          access: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
        },
      ],
    },
  },
  collections: [Pages, Posts, Users],
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await seed(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
