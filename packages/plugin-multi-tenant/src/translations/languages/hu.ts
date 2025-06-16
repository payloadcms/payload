import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const huTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Ön azon van, hogy megváltoztassa a tulajdonjogot <0>{{fromTenant}}</0>-ről <0>{{toTenant}}</0>-re.',
    'confirm-tenant-switch--heading': 'Erősítse meg a(z) {{tenantLabel}} változtatást',
    'field-assignedTentant-label': 'Kijelölt Bérlő',
  },
}

export const hu: PluginLanguage = {
  dateFNSKey: 'hu',
  translations: huTranslations,
}
