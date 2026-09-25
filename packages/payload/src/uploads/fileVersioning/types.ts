export type ManagedFileRole =
  | { sizeKey: string; type: 'size' }
  | { type: 'default' | 'original' | 'thumbnail' }

/** One physical Payload-managed object, which can serve multiple logical roles. */
export type ManagedFile = {
  backend: string
  key: string
  roles: ManagedFileRole[]
}

export type ManagedFileManifest = ManagedFile[]

export type ManagedFileReference = {
  backend: string
  key: string
  role: ManagedFileRole
}

export type ManagedFileIdentity = Pick<ManagedFile, 'backend' | 'key'>
