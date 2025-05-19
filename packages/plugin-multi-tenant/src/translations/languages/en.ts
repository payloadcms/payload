import type { PluginLanguage } from '../types.js'

export const enTranslations = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'You are about to change ownership from <0>{{fromTenant}}</0> to <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Confirm {{tenantLabel}} change',
    'field-assignedTentant-label': 'Assigned Tenant',
  },
}

export const en: PluginLanguage = {
  dateFNSKey: 'en-US',
  translations: enTranslations,
}
