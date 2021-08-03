export type Breadcrumb = {
  url?: string
  label: string
  doc: string
}

export type GenerateURL = (breadcrumbs: Breadcrumb[], currentDoc: Record<string, unknown>) => string;

export type GenerateLabel = (breadcrumbs: Breadcrumb[], currentDoc: Record<string, unknown>) => string;

export type Options = {
  collections: string[]
  generateURL?: GenerateURL
  generateLabel?: GenerateLabel
  parentFieldSlug?: string
  breadcrumbsFieldSlug?: string
}
