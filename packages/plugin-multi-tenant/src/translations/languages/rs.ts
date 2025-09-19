import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const rsTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Postavite vlasništvo ovog dokumenta. Ažurirajte donji izbor i potvrdite svoje promene.',
    'assign-document-modal-title': 'Dodeli dokument',
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
