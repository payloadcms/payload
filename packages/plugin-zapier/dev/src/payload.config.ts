/* eslint-disable no-process-env, import/no-relative-packages */
import type { Access } from 'payload/config'
import { buildConfig } from 'payload/config'
import { Users } from './collections/Users'
import { Posts } from './collections/Posts'
import { zapierPlugin } from '../../src'

const isAdmin: Access = ({ req }) => req?.user?.role === 'admin'

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
    }),
  ],
})
