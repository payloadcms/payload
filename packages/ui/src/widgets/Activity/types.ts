import type { PinnedDocument } from 'payload'

export type DocumentReference = PinnedDocument

export type ActivityDocument = {
  dateLabel?: string
  dateTime?: string
  href: string
  isChanged?: boolean
  isDraft?: boolean
  statusLabel?: string
  thumbnailURL?: string
  title: string
  typeLabel: string
  updatedAt?: string
  viewedAt?: string
} & DocumentReference

export type DocumentsTab = 'pinned' | 'recents'
export type DocumentsPageArgs = {
  excludedCollections?: string[]
  limit: number
  page: number
  shouldIncludePinPlaceholder?: boolean
  tab: DocumentsTab
}
export type DocumentsPage = {
  items: ActivityDocument[]
  page: number
  totalDocs: number
}

export type Labels = {
  addPin: string
  loadError: string
  loading: string
  next: string
  pagination: string
  pinned: string
  pinnedEmpty: string
  pinnedEmptyDescription: string
  pinnedSaveError: string
  previous: string
  recents: string
  recentsEmpty: string
  recentsEmptyDescription: string
  removePin: string
  retry: string
  title: string
}
