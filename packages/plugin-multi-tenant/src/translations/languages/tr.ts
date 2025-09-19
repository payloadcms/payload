import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const trTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Bu belgenin sahipliğini belirleyin. Aşağıdaki seçimi güncelleyin ve değişikliklerinizi onaylayın.',
    'assign-document-modal-title': 'Belge Ata',
    'confirm-modal-tenant-switch--body':
      "<0>{{fromTenant}}</0>'den <0>{{toTenant}}</0>'ye sahipliği değiştirmek üzeresiniz.",
    'confirm-modal-tenant-switch--heading': '{{tenantLabel}} değişikliğini onayla',
    'field-assignedTenant-label': 'Atanan Kiracı',
    'nav-tenantSelector-label': 'Kiracı',
  },
}

export const tr: PluginLanguage = {
  dateFNSKey: 'tr',
  translations: trTranslations,
}
