import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const svTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Du är på väg att ändra ägare från <0>{{fromTenant}}</0> till <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Bekräfta ändring av {{tenantLabel}}',
    'field-assignedTentant-label': 'Tilldelad hyresgäst',
  },
}

export const sv: PluginLanguage = {
  dateFNSKey: 'sv',
  translations: svTranslations,
}
