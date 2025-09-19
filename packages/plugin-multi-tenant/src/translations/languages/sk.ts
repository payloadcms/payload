import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const skTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Nastavte vlastníctvo tohto dokumentu. Aktualizujte výber nižšie a potvrďte svoje zmeny.',
    'assign-document-modal-title': 'Priradiť Dokument',
    'confirm-modal-tenant-switch--body':
      'Chystáte sa zmeniť vlastníctvo z <0>{{fromTenant}}</0> na <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Potvrďte zmenu {{tenantLabel}}',
    'field-assignedTenant-label': 'Pridelený nájomca',
    'nav-tenantSelector-label': 'Nájomca',
  },
}

export const sk: PluginLanguage = {
  dateFNSKey: 'sk',
  translations: skTranslations,
}
