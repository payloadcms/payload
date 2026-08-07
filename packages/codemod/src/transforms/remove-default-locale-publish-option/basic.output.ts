import { buildConfig } from 'payload'

export default buildConfig({
  localization: {
    defaultLocale: 'en',
    locales: [{ code: 'en' }, { code: 'es' }],
  },
  collections: [],
})
