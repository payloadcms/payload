import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': '分配租户',
    'assign-tenant-modal-title': '分配"{{title}}"',
    'field-assignedTenant-label': '指定租户',
    'nav-tenantSelector-label': '租户',
  },
}

export const zh: PluginLanguage = {
  dateFNSKey: 'zh-CN',
  translations: zhTranslations,
}
