import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const rsTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Na putu ste da promenite vlasništvo od <0>{{fromTenant}}</0> do <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Potvrdite promenu {{tenantLabel}}',
    'field-assignedTenant-label': 'Dodeljen stanar',
    'nav-tenantSelector-label': 'Podstanar',
  },
}

export const rs: PluginLanguage = {
  dateFNSKey: 'rs',
  translations: rsTranslations,
}
