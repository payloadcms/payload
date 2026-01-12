import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const thTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'ทุกสถานที่',
    exportDocumentLabel: 'ส่งออก {{label}}',
    exportOptions: 'ตัวเลือกการส่งออก',
    'field-depth-label': 'ความลึก',
    'field-drafts-label': 'รวมฉบับร่าง',
    'field-fields-label': 'สนาม',
    'field-format-label': 'รูปแบบการส่งออก',
    'field-limit-label': 'จำกัด',
    'field-locale-label': 'ที่ตั้ง',
    'field-name-label': 'ชื่อไฟล์',
    'field-page-label': 'หน้า',
    'field-selectionToUse-label': 'การเลือกใช้',
    'field-sort-label': 'เรียงตาม',
    'field-sort-order-label': 'เรียงลำดับตาม',
    'selectionToUse-allDocuments': 'ใช้เอกสารทั้งหมด',
    'selectionToUse-currentFilters': 'ใช้ตัวกรองปัจจุบัน',
    'selectionToUse-currentSelection': 'ใช้การเลือกปัจจุบัน',
    totalDocumentsCount: '{{count}} เอกสารทั้งหมด',
  },
}

export const th: PluginLanguage = {
  dateFNSKey: 'th',
  translations: thTranslations,
}
