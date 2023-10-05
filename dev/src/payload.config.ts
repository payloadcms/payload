import { buildConfig } from 'payload/config'
import path from 'path'
import Users from './collections/Users'
import { payloadCloud } from '../../src'
import { Media } from './collections/Media'

export default buildConfig({
  serverURL: 'http://localhost:3000',
  collections: [Media, Users],
  admin: {
    // NOTE - these webpack extensions are only required
    // for development of this plugin.
    // No need to use these aliases within your own projects.
    webpack: config => {
      const newConfig = {
        ...config,
        resolve: {
          ...(config.resolve || {}),
          alias: {
            ...(config.resolve.alias || {}),
            react: path.resolve(__dirname, '../node_modules/react'),
          },
        },
      }
      return newConfig
    },
  },
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  // @ts-expect-error local reference
  plugins: [payloadCloud()],
  onInit: async payload => {
    const users = await payload.find({
      collection: 'users',
      limit: 1,
    })

    if (!users.docs.length) {
      await payload.create({
        collection: 'users',
        data: {
          email: 'dev@payloadcms.com',
          password: 'test',
        },
      })
    }
  },
})
