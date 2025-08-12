import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const azTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Siz <0>{{fromTenant}}</0>-dən <0>{{toTenant}}</0>-a mülkiyyəti dəyişməyə hazırlaşırsınız',
    'confirm-modal-tenant-switch--heading': '{{tenantLabel}} dəyişikliyini təsdiqləyin',
    'field-assignedTenant-label': 'Təyin edilmiş İcarəçi',
    'nav-tenantSelector-label': 'Kirayəçi',
  },
}

export const az: PluginLanguage = {
  dateFNSKey: 'az',
  translations: azTranslations,
}
