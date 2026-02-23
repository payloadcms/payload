import type { TreeInitialData, TreeProps } from '../Tree/types.js'

export type FolderTreeProps = {
  parentFieldName?: string
} & Omit<TreeProps, 'parentFieldName'>

export type FolderInitialData = TreeInitialData
