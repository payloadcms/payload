import { buildConfig } from 'payload'

export default buildConfig({
  compatibility: {
    allowLocalizedWithinLocalized: true,
  },
  collections: [],
  secret: 'secret',
  db: {} as any,
})
