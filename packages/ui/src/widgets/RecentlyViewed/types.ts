import type { PinnedItem } from './recents.js'

export type RecentDocument = {
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
} & PinnedItem

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
