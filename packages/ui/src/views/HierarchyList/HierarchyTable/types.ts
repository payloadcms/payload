import type { ClientUser, PaginatedDocs } from 'payload'
import type React from 'react'

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
  _hierarchyIcon?: React.ReactNode
  _isLocked?: boolean
  _userEditing?: ClientUser
  id: number | string
}

export const baseClass = 'hierarchy-table'
