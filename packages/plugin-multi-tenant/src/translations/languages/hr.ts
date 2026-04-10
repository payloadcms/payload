import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const hrTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Dodijeli Najmoprimca',
    'assign-tenant-modal-title': 'Dodijeli "{{title}}"',
    'field-assignedTenant-label': 'Dodijeljeni stanar',
    'nav-tenantSelector-label': 'Podstanar',
  },
}

export const hr: PluginLanguage = {
  dateFNSKey: 'hr',
  translations: hrTranslations,
}
