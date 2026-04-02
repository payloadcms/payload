import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const isTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Úthluta sviði',
    'assign-tenant-modal-title': 'Úthluta "{{title}}"',
    'field-assignedTenant-label': 'Úthlutað svið',
    'nav-tenantSelector-label': 'Sía eftir sviði',
  },
}

export const is: PluginLanguage = {
  dateFNSKey: 'is',
  translations: isTranslations,
}
