export interface Page {
  id: string
  parent?: string
  slug: string
  _status?: 'draft' | 'published'
  title?: string
  updatedAt: string
  createdAt: string
}
