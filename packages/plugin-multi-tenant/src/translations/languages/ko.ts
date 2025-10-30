import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const koTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': '테넌트 지정',
    'assign-tenant-modal-title': '"{{title}}"를 지정하십시오.',
    'field-assignedTenant-label': '지정된 세입자',
    'nav-tenantSelector-label': '세입자',
  },
}

export const ko: PluginLanguage = {
  dateFNSKey: 'ko',
  translations: koTranslations,
}
