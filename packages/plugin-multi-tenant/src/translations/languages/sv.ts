import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const svTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Ställ in ägarskapet för detta dokument. Uppdatera urvalet nedan och bekräfta dina ändringar.',
    'assign-document-modal-title': 'Tilldela Dokument',
    'confirm-modal-tenant-switch--body':
      'Du är på väg att ändra ägande från <0>{{fromTenant}}</0> till <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Bekräfta ändring av {{tenantLabel}}',
    'field-assignedTenant-label': 'Tilldelad hyresgäst',
    'nav-tenantSelector-label': 'Hyresgäst',
  },
}

export const sv: PluginLanguage = {
  dateFNSKey: 'sv',
  translations: svTranslations,
}
