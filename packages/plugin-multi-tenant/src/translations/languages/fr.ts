import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const frTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Définissez la propriété de ce document. Mettez à jour la sélection ci-dessous et confirmez vos modifications.',
    'assign-document-modal-title': 'Attribuer le Document',
    'confirm-modal-tenant-switch--body':
      'Vous êtes sur le point de changer la propriété de <0>{{fromTenant}}</0> à <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Confirmer le changement de {{tenantLabel}}',
    'field-assignedTenant-label': 'Locataire Attribué',
    'nav-tenantSelector-label': 'Locataire',
  },
}

export const fr: PluginLanguage = {
  dateFNSKey: 'fr',
  translations: frTranslations,
}
