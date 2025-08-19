import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const esTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Todas las ubicaciones',
    exportDocumentLabel: 'Exportar {{label}}',
    exportOptions: 'Opciones de Exportación',
    'field-depth-label': 'Profundidad',
    'field-drafts-label': 'Incluir borradores',
    'field-fields-label': 'Campos',
    'field-format-label': 'Formato de Exportación',
    'field-limit-label': 'Límite',
    'field-locale-label': 'Localidad',
    'field-name-label': 'Nombre del archivo',
    'field-page-label': 'Página',
    'field-selectionToUse-label': 'Selección para usar',
    'field-sort-label': 'Ordenar por',
    'field-sort-order-label': 'Orden de clasificación',
    'selectionToUse-allDocuments': 'Utilice todos los documentos',
    'selectionToUse-currentFilters': 'Utilice los filtros actuales',
    'selectionToUse-currentSelection': 'Usar selección actual',
    totalDocumentsCount: '{{count}} documentos totales',
  },
}

export const es: PluginLanguage = {
  dateFNSKey: 'es',
  translations: esTranslations,
}
