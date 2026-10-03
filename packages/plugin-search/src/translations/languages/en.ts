import type { GenericTranslationsObject } from '@payloadcms/translations'

export const en: GenericTranslationsObject = {
  $schema: '../translation-schema.json',
  'plugin-search': {
    resultDocument: 'Document',
    resultDocumentUrl: 'Document URL',
    resultPriority: 'Priority',
    resultTitle: 'Title',
    searchResult: 'Search Result',
    searchResults: 'Search Results',
    searchResultsDescription:
      'This is a collection of automatically created search results. These results are used by the global site search and will be updated automatically as documents in the CMS are created or updated.',
  },
}
