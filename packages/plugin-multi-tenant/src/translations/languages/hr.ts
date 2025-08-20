import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const hrTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Na rubu ste promjene vlasništva iz <0>{{fromTenant}}</0> u <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Potvrdite promjenu {{tenantLabel}}',
    'field-assignedTenant-label': 'Dodijeljeni stanar',
    'nav-tenantSelector-label': 'Podstanar',
  },
}

export const hr: PluginLanguage = {
  dateFNSKey: 'hr',
  translations: hrTranslations,
}
