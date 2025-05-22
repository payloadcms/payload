import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const itTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Stai per cambiare proprietà da <0>{{fromTenant}}</0> a <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Conferma il cambiamento di {{tenantLabel}}',
    'field-assignedTentant-label': 'Inquilino Assegnato',
  },
}

export const it: PluginLanguage = {
  dateFNSKey: 'it',
  translations: itTranslations,
}
