import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const thTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'คุณกำลังจะเปลี่ยนความเป็นเจ้าของจาก <0>{{fromTenant}}</0> เป็น <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'ยืนยันการเปลี่ยนแปลง {{tenantLabel}}',
    fields: {
      tenantFieldLabel: 'ผู้เช่าที่ได้รับการมอบหมาย',
    },
  },
}

export const th: PluginLanguage = {
  dateFNSKey: 'th',
  translations: thTranslations,
}
