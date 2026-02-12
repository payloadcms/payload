import type { ClientUser, PaginatedDocs } from 'payload'

export type RelatedGroup = {
  collectionSlug: string
  data: PaginatedDocs
  hasMany: boolean
  label: string
}

export type TableRow = {
  [key: string]: unknown
  _collectionSlug: string
  _hasChildren?: boolean
  _isLocked?: boolean
  _userEditing?: ClientUser
  id: number | string
}

export const baseClass = 'taxonomy-table'
