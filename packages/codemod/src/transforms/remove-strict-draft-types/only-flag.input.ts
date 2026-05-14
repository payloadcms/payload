import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  secret: 'secret',
  db: {} as any,
  typescript: {
    strictDraftTypes: true,
  },
})
