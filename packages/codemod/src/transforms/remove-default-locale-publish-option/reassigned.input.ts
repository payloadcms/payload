import { buildConfig } from 'payload'

let localization = {
  defaultLocale: 'en',
  defaultLocalePublishOption: 'active',
  locales: ['en', 'es'],
}

localization = {
  defaultLocale: 'en',
  defaultLocalePublishOption: 'all',
  locales: ['en', 'es'],
}

export default buildConfig({ localization })
