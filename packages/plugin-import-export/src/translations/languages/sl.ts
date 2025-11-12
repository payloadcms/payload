import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const slTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Vse lokacije',
    exportDocumentLabel: 'Izvozi {{label}}',
    exportOptions: 'Možnosti izvoza',
    'field-depth-label': 'Globina',
    'field-drafts-label': 'Vključi osnutke',
    'field-fields-label': 'Polja',
    'field-format-label': 'Format izvoza',
    'field-limit-label': 'Omejitev',
    'field-locale-label': 'Lokalno',
    'field-name-label': 'Ime datoteke',
    'field-page-label': 'Stran',
    'field-selectionToUse-label': 'Izbor za uporabo',
    'field-sort-label': 'Razvrsti po',
    'field-sort-order-label': 'Razvrsti po vrstnem redu',
    'selectionToUse-allDocuments': 'Uporabite vse dokumente',
    'selectionToUse-currentFilters': 'Uporabite trenutne filtre.',
    'selectionToUse-currentSelection': 'Uporabi trenutno izbiro',
    totalDocumentsCount: '{{count}} skupno dokumentov',
  },
}

export const sl: PluginLanguage = {
  dateFNSKey: 'sl-SI',
  translations: slTranslations,
}
