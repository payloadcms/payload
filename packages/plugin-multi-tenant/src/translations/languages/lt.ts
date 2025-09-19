import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ltTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Nustatykite šio dokumento savininką. Atnaujinkite žemiau esantį pasirinkimą ir patvirtinkite savo pakeitimus.',
    'assign-document-modal-title': 'Priskirti dokumentą',
    'confirm-modal-tenant-switch--body':
      'Jūs ketinate pakeisti nuosavybę iš <0>{{fromTenant}}</0> į <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Patvirtinkite {{tenantLabel}} pakeitimą',
    'field-assignedTenant-label': 'Paskirtas nuomininkas',
    'nav-tenantSelector-label': 'Nuomininkas',
  },
}

export const lt: PluginLanguage = {
  dateFNSKey: 'lt',
  translations: ltTranslations,
}
