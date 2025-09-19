import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const plTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Ustal właściciela tego dokumentu. Zaktualizuj poniższy wybór i potwierdź swoje zmiany.',
    'assign-document-modal-title': 'Przypisz Dokument',
    'confirm-modal-tenant-switch--body':
      'Za chwilę nastąpi zmiana właściciela z <0>{{fromTenant}}</0> na <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Potwierdź zmianę {{tenantLabel}}',
    'field-assignedTenant-label': 'Przypisany Najemca',
    'nav-tenantSelector-label': 'Najemca',
  },
}

export const pl: PluginLanguage = {
  dateFNSKey: 'pl',
  translations: plTranslations,
}
