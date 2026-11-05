import { buildConfig } from 'payload'

const localization = {
  defaultLocale: 'en',
  defaultLocalePublishOption: 'all',
  locales: ['en', 'es'],
}

export default buildConfig({ localization })
