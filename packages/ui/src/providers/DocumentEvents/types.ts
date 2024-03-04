export type UpdatedDocument = {
  entitySlug: string
  id?: number | string
  updatedAt: string
}

export type DocumentEventsContext = {
  mostRecentUpdate: UpdatedDocument
  reportUpdate: (updatedDocument: Array<UpdatedDocument>) => void
}
