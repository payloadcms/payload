import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ptTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Está prestes a mudar a propriedade de <0>{{fromTenant}}</0> para <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Confirme a alteração do {{tenantLabel}}',
    'field-assignedTenant-label': 'Inquilino Atribuído',
    'nav-tenantSelector-label': 'Inquilino',
  },
}

export const pt: PluginLanguage = {
  dateFNSKey: 'pt',
  translations: ptTranslations,
}
