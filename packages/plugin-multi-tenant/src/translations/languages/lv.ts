import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const lvTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Iestatiet šī dokumenta īpašumtiesības. Atjauniniet zemāk esošo izvēli un apstipriniet savas izmaiņas.',
    'assign-document-modal-title': 'Piešķirt Dokumentu',
    'confirm-modal-tenant-switch--body':
      'Jūs gatavojaties mainīt īpašumtiesības no <0>{{fromTenant}}</0> uz <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Apstipriniet {{tenantLabel}} izmaiņu',
    'field-assignedTenant-label': 'Piešķirts Tenant',
    'nav-tenantSelector-label': 'Nomnieks',
  },
}

export const lv: PluginLanguage = {
  dateFNSKey: 'lv',
  translations: lvTranslations,
}
