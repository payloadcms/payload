import type { Language } from '@payloadcms/translations'

import type { enTranslations } from './languages/en.js'

export type PluginLanguage = Language<{
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body': string
    'confirm-tenant-switch--heading': string
    'field-assignedTentant-label': string
  }
}>

export type PluginDefaultTranslationsObject = typeof enTranslations
