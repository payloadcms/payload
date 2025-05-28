import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ptTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Você está prestes a alterar a propriedade de <0>{{fromTenant}}</0> para <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Confirme a alteração de {{tenantLabel}}',
    'field-assignedTentant-label': 'Inquilino Atribuído',
  },
}

export const pt: PluginLanguage = {
  dateFNSKey: 'pt',
  translations: ptTranslations,
}
