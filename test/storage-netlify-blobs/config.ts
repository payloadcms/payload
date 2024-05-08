import { setEnvironmentContext } from '@netlify/blobs'
import { netlifyBlobsStorage } from '@payloadcms/storage-netlify-blobs'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { MediaWithPrefix } from './collections/MediaWithPrefix.js'
import { Users } from './collections/Users.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from './shared.js'

let uploadOptions

// Mock test environment
setEnvironmentContext({
  edgeURL: `http://localhost:8971`,
  siteID: '1',
  token: 'mock',
})

export default buildConfigWithDefaults({
  collections: [Media, MediaWithPrefix, Users],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  plugins: [
    netlifyBlobsStorage({
      collections: {
        [mediaSlug]: true,
        [mediaWithPrefixSlug]: {
          prefix,
        },
      },
    }),
  ],
  upload: uploadOptions,
})
