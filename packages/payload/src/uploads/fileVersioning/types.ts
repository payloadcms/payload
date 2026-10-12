export type StoredFileRole = { sizeKey: string; type: 'size' } | { type: 'default' | 'original' }

/** One stored file. It can be both the original upload and the default file. */
export type StoredFile = {
  key: string
  roles: StoredFileRole[]
}

export type StoredFileList = StoredFile[]

export type StoredFileReference = {
  key: string
  role: StoredFileRole
}

export type StoredFileIdentity = Pick<StoredFile, 'key'>
