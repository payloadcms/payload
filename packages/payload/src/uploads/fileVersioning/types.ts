export type ManagedFileRole =
  | { sizeKey: string; type: 'size' }
  | { type: 'default' | 'original' | 'thumbnail' }

/** One stored file. It can be both the original upload and the default file. */
export type ManagedFile = {
  key: string
  roles: ManagedFileRole[]
  storageBackendId: string
}

export type ManagedFileManifest = ManagedFile[]

export type ManagedFileReference = {
  key: string
  role: ManagedFileRole
  storageBackendId: string
}

export type ManagedFileIdentity = Pick<ManagedFile, 'key' | 'storageBackendId'>
