import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const fiTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Olet siirtämässä omistajuuden <0>{{fromTenant}}</0>:lta <0>{{toTenant}}</0>:lle.',
    'confirm-modal-tenant-switch--heading': 'Vahvista {{tenantLabel}}-muutos',
    'field-assignedTenant-label': 'Määritelty vuokralainen',
    'nav-tenantSelector-label': 'Vuokralainen',
  },
}

export const fi: PluginLanguage = {
  dateFNSKey: 'fi',
  translations: fiTranslations,
}
