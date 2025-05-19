import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const hrTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Upravo ćete promijeniti vlasništvo sa <0>{{fromTenant}}</0> na <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Potvrdi promjenu {{tenantLabel}}',
    'field-assignedTentant-label': 'Dodijeljeni stanar',
  },
}

export const hr: PluginLanguage = {
  dateFNSKey: 'hr',
  translations: hrTranslations,
}
