import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const azTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Siz <0>{{fromTenant}}</0> mülkiyyətini <0>{{toTenant}}</0> mülkiyyətinə dəyişdirəcəksiniz.',
    'confirm-tenant-switch--heading': '{{tenantLabel}} dəyişikliyini təsdiqləyin',
    'field-assignedTentant-label': 'Təyin edilmiş İcarəçi',
  },
}

export const az: PluginLanguage = {
  dateFNSKey: 'az',
  translations: azTranslations,
}
