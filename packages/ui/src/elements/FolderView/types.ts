export interface FolderInterface {
  createdAt: string
  id: string
  name: string
  parentFolder?: FolderInterface | (null | string)
  prefix?: null | string
  updatedAt: string
}

export type Breadcrumb = {
  id: number | string
  name: string
}

export type Subfolder = {
  fileCount: number
  hasSubfolders: boolean
  id: number | string
  name: string
  subfolderCount: number
}
