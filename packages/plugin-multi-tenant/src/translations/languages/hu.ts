import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const huTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Közel áll ahhoz, hogy megváltoztassa a tulajdonságot <0>{{fromTenant}}</0> -ból <0>{{toTenant}}</0> -ba.',
    'confirm-modal-tenant-switch--heading': 'Erősítse meg a {{tenantLabel}} változást',
    'field-assignedTenant-label': 'Kijelölt Bérlő',
    'nav-tenantSelector-label': 'Bérlő',
  },
}

export const hu: PluginLanguage = {
  dateFNSKey: 'hu',
  translations: huTranslations,
}
