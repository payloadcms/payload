export type UpdatedDocument = {
  id?: string
  relationTo: string
}

export type DocumentEventsContext = {
  reportUpdate: (updatedDocument: Array<UpdatedDocument>) => void
  updates: Array<UpdatedDocument>
}
