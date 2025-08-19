import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ptTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Todos os locais',
    exportDocumentLabel: 'Exportar {{label}}',
    exportOptions: 'Opções de Exportação',
    'field-depth-label': 'Profundidade',
    'field-drafts-label': 'Incluir rascunhos',
    'field-fields-label': 'Campos',
    'field-format-label': 'Formato de Exportação',
    'field-limit-label': 'Limite',
    'field-locale-label': 'Localização',
    'field-name-label': 'Nome do arquivo',
    'field-page-label': 'Página',
    'field-selectionToUse-label': 'Seleção para usar',
    'field-sort-label': 'Ordenar por',
    'field-sort-order-label': 'Ordem de classificação',
    'selectionToUse-allDocuments': 'Use todos os documentos',
    'selectionToUse-currentFilters': 'Use os filtros atuais',
    'selectionToUse-currentSelection': 'Use a seleção atual',
    totalDocumentsCount: '{{count}} documentos totais',
  },
}

export const pt: PluginLanguage = {
  dateFNSKey: 'pt',
  translations: ptTranslations,
}
