import { buildConfig } from 'payload/config'
import path from 'path'
import Users from './collections/Users'
import { cloudStorage, azureBlobStorageAdapter } from '../../src'
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
          slug: 'media',
          adapter: azureBlobStorageAdapter({
            connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
            containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
            allowContainerCreate: process.env.AZURE_STORAGE_ALLOW_CONTAINER_CREATE === 'true',
            baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
          }),
        },
      ],
    }),
  ],
})
