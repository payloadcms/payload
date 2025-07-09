import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const nbTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Du er i ferd med å endre eierskap fra <0>{{fromTenant}}</0> til <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Bekreft {{tenantLabel}} endring',
    'field-assignedTentant-label': 'Tildelt leietaker',
  },
}

export const nb: PluginLanguage = {
  dateFNSKey: 'nb',
  translations: nbTranslations,
}
