import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const trTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      "<0>{{fromTenant}}</0>'den <0>{{toTenant}}</0>'ye sahipliği değiştirmek üzeresiniz.",
    'confirm-modal-tenant-switch--heading': '{{tenantLabel}} değişikliğini onayla',
    'field-assignedTenant-label': 'Atanan Kiracı',
    'nav-tenantSelector-label': 'Kiracı',
  },
}

export const tr: PluginLanguage = {
  dateFNSKey: 'tr',
  translations: trTranslations,
}
