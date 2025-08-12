import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const etTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Te olete just muutmas omandiõigust <0>{{fromTenant}}</0> -lt <0>{{toTenant}}</0> -le.',
    'confirm-modal-tenant-switch--heading': 'Kinnita {{tenantLabel}} muutus',
    'field-assignedTenant-label': 'Määratud üürnik',
    'nav-tenantSelector-label': 'Üürnik',
  },
}

export const et: PluginLanguage = {
  dateFNSKey: 'et',
  translations: etTranslations,
}
