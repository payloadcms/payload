import { buildConfig } from 'payload'

const localization = {
  defaultLocale: 'en',
  locales: ['en', 'es'],
}

export default buildConfig({ localization })
