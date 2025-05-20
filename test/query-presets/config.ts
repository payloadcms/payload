import { fileURLToPath } from 'node:url'
import path from 'path'
import { APIError } from 'payload'

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
      read: ({ req: { user } }) => Boolean(user?.roles?.length && !user?.roles?.includes('user')),
      update: ({ req: { user } }) => Boolean(user?.roles?.length && !user?.roles?.includes('user')),
    },
    hooks: {
      beforeValidate: [
        // this is a custom `beforeValidate` hook that runs before the preset is validated
        // it ensures that if the user is trying to change a constraint to "onlyAdmins", they must be an admin themselves
        ({ data, req, originalDoc }) => {
          const isSharingWithAdmins =
            (data?.access?.read?.constraint === 'onlyAdmins' &&
              (!originalDoc || originalDoc?.access?.read?.constraint !== 'onlyAdmins')) ||
            (data?.access?.update?.constraint === 'onlyAdmins' &&
              (!originalDoc || originalDoc?.access?.update?.constraint !== 'onlyAdmins'))

          if (isSharingWithAdmins && !req.user?.roles?.includes('admin')) {
            throw new APIError(
              'You must be an admin to share this preset with admins.',
              403,
              {},
              true,
            )
          }

          return data
        },
      ],
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
        {
          label: 'Noone',
          value: 'noone',
          access: () => false,
        },
        {
          label: 'Only Admins',
          value: 'onlyAdmins',
          access: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
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
          access: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
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
