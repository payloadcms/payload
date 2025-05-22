import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const slTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Ravno ste pred spremembo lastništva iz <0>{{fromTenant}}</0> na <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Potrdi spremembo {{tenantLabel}}',
    'field-assignedTentant-label': 'Dodeljen najemnik',
  },
}

export const sl: PluginLanguage = {
  dateFNSKey: 'sl-SI',
  translations: slTranslations,
}
