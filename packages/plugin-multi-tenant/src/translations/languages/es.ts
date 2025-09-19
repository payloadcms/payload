import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const esTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Establezca la propiedad de este documento. Actualice la selección a continuación y confirme sus cambios.',
    'assign-document-modal-title': 'Asignar Documento',
    'confirm-modal-tenant-switch--body':
      'Está a punto de cambiar la propiedad de <0>{{fromTenant}}</0> a <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Confirme el cambio de {{tenantLabel}}',
    'field-assignedTenant-label': 'Inquilino Asignado',
    'nav-tenantSelector-label': 'Inquilino',
  },
}

export const es: PluginLanguage = {
  dateFNSKey: 'es',
  translations: esTranslations,
}
