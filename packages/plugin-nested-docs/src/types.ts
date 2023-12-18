export interface Breadcrumb {
  doc: string
  label: string
  url?: string
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
  breadcrumbsFieldSlug?: string
  collections: string[]
  generateLabel?: GenerateLabel
  generateURL?: GenerateURL
  parentFieldSlug?: string
}
