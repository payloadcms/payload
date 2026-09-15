import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  typescript: {
    outputFile: 'payload-types.ts',
    strictDraftTypes: true,
  },
})
