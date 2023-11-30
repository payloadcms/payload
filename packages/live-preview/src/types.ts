export type LivePreviewArgs = {}

export type LivePreview = void

export type PopulationsByCollection = {
  [slug: string]: Array<{
    accessor: number | string
    id: number | string
    ref: Record<string, unknown>
  }>
}

// TODO: import this from `payload/admin/components/utilities/DocumentEvents/types.ts`
export type UpdatedDocument = {
  entitySlug: string
  id?: number | string
  updatedAt: string
}
