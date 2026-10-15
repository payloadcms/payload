import type { GenericTranslationsObject } from '@payloadcms/translations'

export const it: GenericTranslationsObject = {
  $schema: '../translation-schema.json',
  'plugin-search': {
    resultDocument: 'Documento',
    resultDocumentUrl: 'URL del documento',
    resultPriority: 'Priorità',
    resultTitle: 'Titolo',
    searchResult: 'Risultato della ricerca',
    searchResults: 'Risultati della ricerca',
    searchResultsDescription:
      'Questa è una raccolta di risultati di ricerca creati automaticamente. Questi risultati sono utilizzati dalla ricerca globale del sito e verranno aggiornati automaticamente quando i documenti nel CMS vengono creati o aggiornati.',
  },
}
