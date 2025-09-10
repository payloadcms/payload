import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const csTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Chystáte se změnit vlastnictví z <0>{{fromTenant}}</0> na <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Potvrďte změnu {{tenantLabel}}',
    'field-assignedTenant-label': 'Přiřazený nájemce',
    'nav-tenantSelector-label': 'Nájemce',
  },
}

export const cs: PluginLanguage = {
  dateFNSKey: 'cs',
  translations: csTranslations,
}
