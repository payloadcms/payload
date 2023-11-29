export type LivePreviewArgs = {}

export type LivePreview = void

export type PopulationsByCollection = {
  [slug: string]: Array<{
    accessor: number | string
    id: number | string
    ref: Record<string, unknown>
  }>
}

// TODO: import this from `payload/utilities`
export type RecentUpdate = {
  entitySlug: string
  id?: string
  updatedAt: string
}
