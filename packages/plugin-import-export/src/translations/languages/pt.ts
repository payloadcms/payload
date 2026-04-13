import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ptTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Todos os locais',
    collectionRequired: 'Coleção necessária para mostrar a pré-visualização',
    documentsToExport: '{{count}} documentos para exportar',
    documentsToImport: '{{count}} documentos para importar',
    exportDocumentLabel: 'Exportar {{label}}',
    exportOptions: 'Opções de Exportação',
    'field-collectionSlug-label': 'Coleção',
    'field-depth-label': 'Profundidade',
    'field-drafts-label': 'Incluir rascunhos',
    'field-fields-label': 'Campos',
    'field-format-label': 'Formato de Exportação',
    'field-importMode-create-label': 'Crie novos documentos',
    'field-importMode-label': 'Modo de Importação',
    'field-importMode-update-label': 'Atualize documentos existentes',
    'field-importMode-upsert-label': 'Crie ou atualize documentos',
    'field-limit-label': 'Limite',
    'field-locale-label': 'Localização',
    'field-matchField-description':
      'Campo a ser usado para correspondência de documentos existentes',
    'field-matchField-label': 'Campo Correspondente',
    'field-name-label': 'Nome do arquivo',
    'field-page-label': 'Página',
    'field-selectionToUse-label': 'Seleção para usar',
    'field-sort-label': 'Ordenar por',
    'field-sort-order-label': 'Ordem de classificação',
    'field-status-label': 'Estado',
    'field-summary-label': 'Resumo da Importação',
    importDocumentLabel: 'Importar {{label}}',
    importResults: 'Resultados de Importação',
    limitCapped: 'Limite restringido ao máximo de {{limit}}',
    limitExceededExport: 'Exportação limitada a {{limit}} documentos',
    limitExceededImport:
      'O arquivo de importação contém {{count}} documentos, mas o limite é {{limit}}',
    matchBy: 'Correspondência por',
    mode: 'Modo',
    noDataToPreview: 'Sem dados para visualizar',
    previewPageInfo: '{{start}}-{{end}} de {{total}}',
    'selectionToUse-allDocuments': 'Use todos os documentos',
    'selectionToUse-currentFilters': 'Use os filtros atuais',
    'selectionToUse-currentSelection': 'Use a seleção atual',
    startImport: 'Iniciar Importação',
    totalDocumentsCount: '{{count}} documentos totais',
    uploadFileToSeePreview: 'Carregue um arquivo para ver a pré-visualização',
  },
}

export const pt: PluginLanguage = {
  dateFNSKey: 'pt',
  translations: ptTranslations,
}
