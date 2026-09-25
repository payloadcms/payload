export type ManagedFileRole =
  | { sizeKey: string; type: 'size' }
  | { type: 'default' | 'original' | 'thumbnail' }

/** One physical Payload-managed object, which can serve multiple logical roles. */
export type ManagedFile = {
  key: string
  /** Every use of this object; an unchanged upload can be both original and default. */
  roles: ManagedFileRole[]
  /** Stable identity of the configured storage location, not just the adapter's type or name. */
  storageBackendId: string
}

export type ManagedFileManifest = ManagedFile[]

export type ManagedFileReference = {
  key: string
  role: ManagedFileRole
  storageBackendId: string
}

export type ManagedFileIdentity = Pick<ManagedFile, 'key' | 'storageBackendId'>
