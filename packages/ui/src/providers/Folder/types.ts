import type { FolderInitialData } from '../../elements/FolderTree/types.js'

export type FolderContextValue = {
  collectionSlug: string
  expandedNodes: Set<number | string>
  parentFieldName: string
  selectedFolderId: null | number | string
  toggleNode: (id: number | string) => void
  treeData: FolderInitialData | null
  treeLimit: number
}
