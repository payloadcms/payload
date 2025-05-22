import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const trTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      "Sahipliği <0>{{fromTenant}}</0>'den <0>{{toTenant}}</0>'e değiştirmek üzeresiniz.",
    'confirm-tenant-switch--heading': '{{tenantLabel}} değişikliğini onayla',
    'field-assignedTentant-label': 'Atanan Kiracı',
  },
}

export const tr: PluginLanguage = {
  dateFNSKey: 'tr',
  translations: trTranslations,
}
