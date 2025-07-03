import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const daTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Du er ved at ændre ejerskab fra <0>{{fromTenant}}</0> til <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Bekræft {{tenantLabel}} ændring',
    'field-assignedTentant-label': 'Tildelt Lejer',
  },
}

export const da: PluginLanguage = {
  dateFNSKey: 'da',
  translations: daTranslations,
}
