import { buildConfig } from 'payload'

export default buildConfig({
  localization: {
    defaultLocale: 'en',
    defaultLocalePublishOption: 'all',
    locales: [{ code: 'en' }, { code: 'es' }],
  },
  collections: [],
})
