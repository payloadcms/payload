import { buildConfig } from 'payload/config'
import path from 'path'
import Users from './collections/Users'
import { cloudStorage } from '../../src/plugin'
import { Media } from './collections/Media'

export default buildConfig({
  serverURL: 'http://localhost:3000',
  collections: [Media, Users],
  admin: {
    // NOTE - these webpack extensions are only required
    // for development of this plugin while linking a local copy of Payload.
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
  plugins: [
    cloudStorage({
      collections: [
        {
          slug: 'users',
        },
      ],
    }),
  ],
})
