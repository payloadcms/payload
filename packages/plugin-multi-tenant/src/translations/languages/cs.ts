import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const csTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Chystáte se změnit vlastnictví z <0>{{fromTenant}}</0> na <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Potvrďte změnu {{tenantLabel}}',
    'field-assignedTentant-label': 'Přiřazený nájemce',
  },
}

export const cs: PluginLanguage = {
  dateFNSKey: 'cs',
  translations: csTranslations,
}
