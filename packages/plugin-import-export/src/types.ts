import type { JsonObject, PaginatedDocs } from 'payload'

export type ImportExportPluginOptions = {}

export type CollectionExport = {
  data: JsonObject | PaginatedDocs['docs']
  slug: string
}
