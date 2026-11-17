import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { DefaultColumns } from './collections/DefaultColumns.js'
import { Pages } from './collections/Pages/index.js'
import { Posts } from './collections/Posts/index.js'
import { Users } from './collections/Users/index.js'
import { roles } from './fields/roles.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'query-presets',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Pages, Posts, Users, DefaultColumns],
    queryPresets: {
      // labels: {
      //   singular: 'Report',
      //   plural: 'Reports',
      // },
      access: {
        read: ({ req: { user } }) => Boolean(user?.roles?.length && !user?.roles?.includes('user')),
        update: ({ req: { user } }) =>
          Boolean(user?.roles?.length && !user?.roles?.includes('user')),
      },
      constraints: {
        read: [
          {
            access: ({ req: { user } }) => ({
              'access.read.roles': {
                in: user?.roles || [],
              },
            }),
            fields: [roles],
            label: 'Specific Roles',
            value: 'specificRoles',
          },
          {
            access: () => false,
            label: 'Noone',
            value: 'noone',
          },
          {
            access: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
            label: 'Only Admins',
            value: 'onlyAdmins',
          },
        ],
        update: [
          {
            access: ({ req: { user } }) => ({
              'access.update.roles': {
                in: user?.roles || [],
              },
            }),
            fields: [roles],
            label: 'Specific Roles',
            value: 'specificRoles',
          },
          {
            access: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
            label: 'Only Admins',
            value: 'onlyAdmins',
          },
        ],
      },
      filterConstraints: async ({ options, req }) => {
        await Promise.resolve()

        return !req.user?.roles?.includes('admin')
          ? options.filter(
              (option) => (typeof option === 'string' ? option : option.value) !== 'onlyAdmins',
            )
          : options
      },
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed,
})
