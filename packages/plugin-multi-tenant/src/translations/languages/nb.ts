import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const nbTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Angi eierskapet til dette dokumentet. Oppdater valget nedenfor og bekreft endringene dine.',
    'assign-document-modal-title': 'Tildel Dokument',
    'confirm-modal-tenant-switch--body':
      'Du er i ferd med å endre eierskap fra <0>{{fromTenant}}</0> til <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Bekreft endring av {{tenantLabel}}',
    'field-assignedTenant-label': 'Tildelt leietaker',
    'nav-tenantSelector-label': 'Leietaker',
  },
}

export const nb: PluginLanguage = {
  dateFNSKey: 'nb',
  translations: nbTranslations,
}
