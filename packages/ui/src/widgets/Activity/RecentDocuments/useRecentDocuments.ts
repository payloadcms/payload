import type { DocumentsPage } from '../Documents/types.js'

import { useDocuments } from '../Documents/useDocuments.js'

export type RecentDocumentsController = ReturnType<typeof useRecentDocuments>

export function useRecentDocuments(args: {
  excludedCollections?: string[]
  initialPage?: DocumentsPage
  isActive: boolean
  offset: number
  pageSize: number
}) {
  return useDocuments({ ...args, tab: 'recents' })
}
