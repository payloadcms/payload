import { searchPlugin } from '@payloadcms/plugin-search'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  plugins: [
    searchPlugin({
      collections: ['posts'],
    }),
  ],
})
