import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const etTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Te olete tegemas omandiõiguse muudatust <0>{{fromTenant}}</0>lt <0>{{toTenant}}</0>le.',
    'confirm-tenant-switch--heading': 'Kinnita {{tenantLabel}} muutus',
    'field-assignedTentant-label': 'Määratud üürnik',
  },
}

export const et: PluginLanguage = {
  dateFNSKey: 'et',
  translations: etTranslations,
}
