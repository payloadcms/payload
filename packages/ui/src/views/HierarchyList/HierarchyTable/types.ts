import type { PaginatedDocs, User } from 'payload'
import type React from 'react'

export type RelatedGroup = {
  collectionSlug: string
  data: PaginatedDocs
  fieldName: string
  hasMany: boolean
  label: string
}

export type TableRow = {
  [key: string]: unknown
  _collectionLabel: string
  _collectionSlug: string
  _hasChildren?: boolean
  _hierarchyIcon?: React.ReactNode
  _isLocked?: boolean
  _userEditing?: User
  id: number | string
}

export const baseClass = 'hierarchy-tables'
