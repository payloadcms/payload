import type { Language } from '@payloadcms/translations'

import type { enTranslations } from './languages/en.js'

export type PluginLanguage = Language<{
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body': string
    'confirm-modal-tenant-switch--heading': string
    'field-assignedTenant-label': string
    'nav-tenantSelector-label': string
  }
}>

export type PluginDefaultTranslationsObject = typeof enTranslations
