import { azureStorage } from '@payloadcms/storage-azure'
import { buildConfig } from 'payload'

export default buildConfig({
  storage: [
    azureStorage({
      collections: { media: true },
      clientUploads: { access: ({ req }) => Boolean(req.user) },
    }),
  ],
})
