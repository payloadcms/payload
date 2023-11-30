export type LivePreviewArgs = {}

export type LivePreview = void

export type PopulationsByCollection = {
  [slug: string]: Array<{
    accessor: number | string
    id: number | string
    ref: Record<string, unknown>
  }>
}
