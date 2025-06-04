import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bgTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Предстои да промените собствеността от <0>{{fromTenant}}</0> на <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Потвърдете промяната на {{tenantLabel}}',
    'field-assignedTentant-label': 'Назначен наемател',
  },
}

export const bg: PluginLanguage = {
  dateFNSKey: 'bg',
  translations: bgTranslations,
}
