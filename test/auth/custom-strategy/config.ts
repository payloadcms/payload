import { Strategy } from 'passport-strategy'

import type { Payload } from '../../../packages/payload/src/index.js'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { usersSlug } from './shared.js'

export const strategyName = 'test-local'

export class CustomStrategy extends Strategy {
  ctx: Payload

  constructor(ctx: Payload) {
    super()
    this.ctx = ctx
  }

  authenticate(req: Request, options?: any): void {
    if (!req.headers.code && !req.headers.secret) {
      return this.success(null)
    }
    this.ctx
      .find({
        collection: usersSlug,
        where: {
          code: {
            equals: req.headers.code,
          },
          secret: {
            equals: req.headers.secret,
          },
        },
      })
      .then((users) => {
        if (users.docs && users.docs.length) {
          const user = users.docs[0]
          user.collection = usersSlug
          user._strategy = `${usersSlug}-${strategyName}`
          this.success(user)
        } else {
          this.error(null)
        }
      })
  }
}

export default buildConfigWithDefaults({
  admin: {
    user: 'users',
  },
  collections: [
    {
      slug: usersSlug,
      auth: {
        disableLocalStrategy: true,
        strategies: [
          {
            name: strategyName,
            strategy: (ctx) => new CustomStrategy(ctx),
          },
        ],
      },
      access: {
        create: () => true,
      },
      fields: [
        {
          name: 'code',
          label: 'Code',
          type: 'text',
          unique: true,
          index: true,
        },
        {
          name: 'secret',
          label: 'Secret',
          type: 'text',
        },
        {
          name: 'name',
          label: 'Name',
          type: 'text',
        },
        {
          name: 'roles',
          label: 'Role',
          type: 'select',
          options: ['admin', 'editor', 'moderator', 'user', 'viewer'],
          defaultValue: 'user',
          required: true,
          saveToJWT: true,
          hasMany: true,
        },
      ],
    },
  ],
})
