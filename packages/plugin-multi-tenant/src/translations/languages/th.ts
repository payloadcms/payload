import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const thTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'คุณกำลังจะเปลี่ยนสิทธิ์การเป็นเจ้าของจาก <0>{{fromTenant}}</0> ไปยัง <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'ยืนยันการเปลี่ยนแปลง {{tenantLabel}}',
    'field-assignedTenant-label': 'ผู้เช่าที่ได้รับการกำหนด',
    'nav-tenantSelector-label': 'ผู้เช่า',
  },
}

export const th: PluginLanguage = {
  dateFNSKey: 'th',
  translations: thTranslations,
}
