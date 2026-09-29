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
  /**
   * Where drilling into this hierarchy item should navigate. Set on folder rows so a click stays in
   * whichever collection is being browsed - a folder opened from "Media by Folder" has to keep
   * showing media, not switch to the folder collection's own view.
   */
  _browseHref?: string
  _collectionLabel: string
  _collectionSlug: string
  _hasChildren?: boolean
  _hierarchyIcon?: React.ReactNode
  _isLocked?: boolean
  _userEditing?: User
  id: number | string
}

export const baseClass = 'hierarchy-tables'
