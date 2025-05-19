import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const nlTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'U staat op het punt het eigendom te wijzigen van <0>{{fromTenant}}</0> naar <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Bevestig wijziging van {{tenantLabel}}',
    'field-assignedTentant-label': 'Toegewezen Huurder',
  },
}

export const nl: PluginLanguage = {
  dateFNSKey: 'nl',
  translations: nlTranslations,
}
