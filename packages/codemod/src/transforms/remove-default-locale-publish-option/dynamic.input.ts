import { buildConfig } from 'payload'

const localization = createLocalization()

export default buildConfig({ localization })

function createLocalization() {
  return {
    defaultLocale: 'en',
    defaultLocalePublishOption: 'all',
    locales: ['en', 'es'],
  }
}
