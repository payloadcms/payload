export interface Breadcrumb {
  url?: string
  label: string
  doc: string | number
}

export type GenerateURL = (
  docs: Array<Record<string, unknown>>,
  currentDoc: Record<string, unknown>,
) => string

export type GenerateLabel = (
  docs: Array<Record<string, unknown>>,
  currentDoc: Record<string, unknown>,
) => string

export interface PluginConfig {
  collections: string[]
  generateURL?: GenerateURL
  generateLabel?: GenerateLabel
  parentFieldSlug?: string
  breadcrumbsFieldSlug?: string
  dbType?: 'mongoose' | 'postgres'
}
