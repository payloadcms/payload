import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  secret: 'secret',
  db: {} as any,
  typescript: {
    outputFile: './payload-types.ts',
  },
})
