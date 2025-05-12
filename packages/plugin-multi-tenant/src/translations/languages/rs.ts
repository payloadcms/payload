import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const rsTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Upravo ćete promeniti vlasništvo sa <0>{{fromTenant}}</0> na <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Potvrdi promena {{tenantLabel}}',
  },
}

export const rs: PluginLanguage = {
  dateFNSKey: 'rs',
  translations: rsTranslations,
}
