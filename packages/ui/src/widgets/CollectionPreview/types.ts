import type React from 'react'

import type { DocumentLayout } from '../../elements/LayoutToggle/index.js'

export type CollectionPreviewDocument = {
  dateLabel?: string
  dateTime?: string
  href: string
  id: number | string
  thumbnailURL?: string
  title: string
}

export type CollectionPreviewProps = {
  collectionSlug: string
  createHref?: string
  createLabel: string
  description?: React.ReactNode
  documents: CollectionPreviewDocument[]
  emptyLabel: string
  href: string
  initialLayout?: DocumentLayout
  isAuth: boolean
  isBulkUploadEnabled?: boolean
  label: string
  loadError?: string
  mimeTypes?: string[]
  table?: React.ReactNode
}
