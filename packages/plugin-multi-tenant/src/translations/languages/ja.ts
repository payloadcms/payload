import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const jaTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'テナントを割り当てる',
    'assign-tenant-modal-fallback-title': '新しい{{entity}}を割り当てる',
    'field-assignedTenant-label': '割り当てられたテナント',
    'nav-tenantSelector-label': 'テナント',
  },
}

export const ja: PluginLanguage = {
  dateFNSKey: 'ja',
  translations: jaTranslations,
}
