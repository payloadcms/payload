import type { TypeWithID } from 'payload'

export interface FolderInterface {
  createdAt: string
  id: string
  name: string
  parentFolder?: FolderInterface | (null | string)
  prefix?: null | string
  updatedAt: string
}

export type Subfolder = {
  fileCount: number
  hasSubfolders: boolean
  id: number | string
  name: string
  subfolderCount: number
}

export type PolymorphicRelationshipValue = {
  relationTo: string
  value: number | string | TypeWithID
}

export type MoveItemType = PolymorphicRelationshipValue
