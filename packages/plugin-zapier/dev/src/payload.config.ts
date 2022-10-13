/* eslint-disable no-process-env, import/no-relative-packages */
import type { Access } from 'payload/config'
import { buildConfig } from 'payload/config'
import { Users } from './collections/Users'
import { Posts } from './collections/Posts'
import { zapierPlugin } from '../../src'
import type { ZapCondition } from '../../src/types'
import type { Post } from '../payload-types'

const isAdmin: Access = ({ req }) => req?.user?.role === 'admin'

const zapCondition: ZapCondition<Post> = async args => {
  const { doc, hook } = args
  if (hook === 'afterChange' && args.operation === 'create' && doc.enableZap) {
    return true
  }

  return false
}

export default buildConfig({
  collections: [Users, Posts],
  plugins: [
    zapierPlugin({
      access: {
        create: isAdmin,
        read: isAdmin,
        update: isAdmin,
        delete: isAdmin,
      },
      zapCollections: [
        {
          slug: 'posts',
          zapHooks: [
            {
              type: 'afterChange',
              condition: zapCondition,
            },
          ],
        },
      ],
    }),
  ],
})
