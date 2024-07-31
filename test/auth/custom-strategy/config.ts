import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { AuthStrategyFunction } from 'payload'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { usersSlug } from './shared.js'

export const strategyName = 'test-local'

const customAuthenticationStrategy: AuthStrategyFunction = async ({ headers, payload }) => {
  const usersQuery = await payload.find({
    collection: usersSlug,
    where: {
      code: {
        equals: headers.get('code'),
      },
      secret: {
        equals: headers.get('secret'),
      },
    },
  })

  const user = usersQuery.docs[0] || null
  if (!user) return { user: null }

  return {
    responseHeaders: new Headers({
      'Smile-For-Me': 'please',
    }),
    user: {
      ...user,
      _strategy: `${usersSlug}-${strategyName}`,
      collection: usersSlug,
    },
  }
}

export default buildConfigWithDefaults({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: usersSlug,
      access: {
        create: () => true,
      },
      auth: {
        disableLocalStrategy: true,
        strategies: [
          {
            name: strategyName,
            authenticate: customAuthenticationStrategy,
          },
        ],
      },
      fields: [
        {
          name: 'code',
          type: 'text',
          index: true,
          label: 'Code',
          unique: true,
        },
        {
          name: 'secret',
          type: 'text',
          label: 'Secret',
        },
        {
          name: 'name',
          type: 'text',
          label: 'Name',
        },
        {
          name: 'roles',
          type: 'select',
          defaultValue: ['user'],
          hasMany: true,
          label: 'Role',
          options: ['admin', 'editor', 'moderator', 'user', 'viewer'],
          required: true,
          saveToJWT: true,
        },
      ],
    },
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
