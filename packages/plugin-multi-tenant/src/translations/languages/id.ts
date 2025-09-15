import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const idTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Anda akan mengubah kepemilikan dari <0>{{fromTenant}}</0> ke <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Konfirmasi perubahan {{tenantLabel}}',
    'field-assignedTenant-label': 'Penyewa yang Ditugaskan',
    'nav-tenantSelector-label': 'Penyewa',
  },
}

export const id: PluginLanguage = {
  dateFNSKey: 'id',
  translations: idTranslations,
}
