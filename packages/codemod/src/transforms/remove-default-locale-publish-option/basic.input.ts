import { buildConfig } from 'payload'

export default buildConfig({
  localization: {
    defaultLocale: 'en',
    defaultLocalePublishOption: 'active',
    locales: [{ code: 'en' }, { code: 'es' }],
  },
  collections: [],
})
