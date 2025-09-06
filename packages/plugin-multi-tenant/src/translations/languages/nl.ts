import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const nlTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'U staat op het punt om eigenaarschap te wijzigen van <0>{{fromTenant}}</0> naar <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Bevestig wijziging van {{tenantLabel}}',
    'field-assignedTenant-label': 'Toegewezen Huurder',
    'nav-tenantSelector-label': 'Huurder',
  },
}

export const nl: PluginLanguage = {
  dateFNSKey: 'nl',
  translations: nlTranslations,
}
