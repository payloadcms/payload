import { buildConfig } from 'payload'

export default buildConfig({
  experimental: {
    localizeStatus: true,
    someOtherFlag: true,
  },
  collections: [],
})
