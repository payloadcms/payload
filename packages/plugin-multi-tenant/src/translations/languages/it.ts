import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const itTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Imposta la proprietà di questo documento. Aggiorna la selezione qui sotto e conferma le tue modifiche.',
    'assign-document-modal-title': 'Assegna Documento',
    'confirm-modal-tenant-switch--body':
      'Stai per cambiare il possesso da <0>{{fromTenant}}</0> a <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Conferma il cambiamento di {{tenantLabel}}',
    'field-assignedTenant-label': 'Inquilino Assegnato',
    'nav-tenantSelector-label': 'Inquilino',
  },
}

export const it: PluginLanguage = {
  dateFNSKey: 'it',
  translations: itTranslations,
}
