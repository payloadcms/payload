/* eslint-disable no-process-env, import/no-relative-packages */
import { buildConfig } from 'payload/config'
import { Users } from './collections/Users'
import { Posts } from './collections/Posts'
import { zapierPlugin } from '../../src'

export default buildConfig({
  collections: [Users, Posts],
  plugins: [
    zapierPlugin({
      collections: ['*'],
      webhookURL: process.env.ZAPIER_WEBHOOK_URL,
      enabled: ({ req }) => {
        return req.user.role === 'admin'
      },
    }),
  ],
})
