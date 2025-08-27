import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const huTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Minden helyszín',
    exportDocumentLabel: '{{label}} exportálása',
    exportOptions: 'Exportálási lehetőségek',
    'field-depth-label': 'Mélység',
    'field-drafts-label': 'Tartalmazza a vázlatokat',
    'field-fields-label': 'Mezők',
    'field-format-label': 'Export formátum',
    'field-limit-label': 'Korlát',
    'field-locale-label': 'Helyszín',
    'field-name-label': 'Fájlnév',
    'field-page-label': 'Oldal',
    'field-selectionToUse-label': 'Használatra kiválasztva',
    'field-sort-label': 'Rendezés szerint',
    'field-sort-order-label': 'Rendezési sorrend',
    'selectionToUse-allDocuments': 'Használjon minden dokumentumot',
    'selectionToUse-currentFilters': 'Használja az aktuális szűrőket',
    'selectionToUse-currentSelection': 'Használja a jelenlegi kiválasztást',
    totalDocumentsCount: '{{count}} összes dokumentum',
  },
}

export const hu: PluginLanguage = {
  dateFNSKey: 'hu',
  translations: huTranslations,
}
