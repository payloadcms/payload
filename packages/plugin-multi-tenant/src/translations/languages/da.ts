import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const daTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Du er ved at skifte ejerskab fra <0>{{fromTenant}}</0> til <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Bekræft ændring af {{tenantLabel}}',
    'field-assignedTenant-label': 'Tildelt Lejer',
    'nav-tenantSelector-label': 'Lejer',
  },
}

export const da: PluginLanguage = {
  dateFNSKey: 'da',
  translations: daTranslations,
}
