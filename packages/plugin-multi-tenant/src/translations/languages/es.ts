import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const esTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Asignar Inquilino',
    'assign-tenant-modal-title': 'Asignar "{{title}}"',
    'field-assignedTenant-label': 'Inquilino Asignado',
    'nav-tenantSelector-label': 'Inquilino',
  },
}

export const es: PluginLanguage = {
  dateFNSKey: 'es',
  translations: esTranslations,
}
