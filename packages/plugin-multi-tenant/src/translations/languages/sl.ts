import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const slTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Pravkar ste na točki, da spremenite lastništvo iz <0>{{fromTenant}}</0> v <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Potrdite spremembo {{tenantLabel}}',
    'field-assignedTenant-label': 'Dodeljen najemnik',
    'nav-tenantSelector-label': 'Najemnik',
  },
}

export const sl: PluginLanguage = {
  dateFNSKey: 'sl-SI',
  translations: slTranslations,
}
