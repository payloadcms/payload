import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const jaTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'あなたは、<0>{{fromTenant}}</0>から<0>{{toTenant}}</0>への所有権を変更しようとしています。',
    'confirm-modal-tenant-switch--heading': '{{tenantLabel}}の変更を確認します',
    'field-assignedTenant-label': '割り当てられたテナント',
    'nav-tenantSelector-label': 'テナント',
  },
}

export const ja: PluginLanguage = {
  dateFNSKey: 'ja',
  translations: jaTranslations,
}
