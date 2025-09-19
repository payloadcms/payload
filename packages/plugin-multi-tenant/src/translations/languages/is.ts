import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const isTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Stilltu eigendur þessa skjals. Uppfærðu völdin hér að neðan og staðfestu breytingarnar þínar.',
    'assign-document-modal-title': 'Úthluta skjal',
    'confirm-modal-tenant-switch--body':
      'Þú ert um það bil að breyta eigandafrá <0>{{fromTenant}}</0> yfir í <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Staðfesta breytingu á {{tenantLabel}}',
    'field-assignedTenant-label': 'Úthlutaður Leigjandi',
    'nav-tenantSelector-label': 'Leigjandi',
  },
}

export const is: PluginLanguage = {
  dateFNSKey: 'is',
  translations: isTranslations,
}
