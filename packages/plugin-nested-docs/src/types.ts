export type Breadcrumb = {
  url?: string
  label: string
  doc: string
}

export type GenerateURL = (docs: Record<string, unknown>[], currentDoc: Record<string, unknown>) => string;

export type GenerateLabel = (docs: Record<string, unknown>[], currentDoc: Record<string, unknown>) => string;

export type Options = {
  collections: string[]
  generateURL?: GenerateURL
  generateLabel?: GenerateLabel
  parentFieldSlug?: string
  breadcrumbsFieldSlug?: string
}
