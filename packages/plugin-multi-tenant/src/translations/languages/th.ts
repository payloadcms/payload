import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const thTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'กำหนดผู้เช่า',
    'assign-tenant-modal-title': 'มอบหมาย "{{title}}"',
    'field-assignedTenant-label': 'ผู้เช่าที่ได้รับการกำหนด',
    'nav-tenantSelector-label': 'ผู้เช่า',
  },
}

export const th: PluginLanguage = {
  dateFNSKey: 'th',
  translations: thTranslations,
}
