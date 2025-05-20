import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const jaTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'あなたは所有権を<0>{{fromTenant}}</0>から<0>{{toTenant}}</0>へ変更しようとしています',
    'confirm-tenant-switch--heading': '{{tenantLabel}}の変更を確認してください',
    'field-assignedTentant-label': '割り当てられたテナント',
  },
}

export const ja: PluginLanguage = {
  dateFNSKey: 'ja',
  translations: jaTranslations,
}
