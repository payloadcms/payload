export type StoredFileRole = { sizeKey: string; type: 'size' } | { type: 'default' | 'original' }

/** One stored file. It can be both the original upload and the default file. */
export type StoredFile = {
  key: string
  roles: StoredFileRole[]
}

export type StoredFileList = StoredFile[]

/** One file of a saved upload, for one role. Only a stored entry has an object in storage. */
export type UploadFileEntry =
  | {
      filename: string
      /** The object's resolved storage key. */
      key: string
      role: StoredFileRole
      status: 'stored'
    }
  | {
      filename: string
      role: StoredFileRole
      /** `requestTime`: built when requested (`_stored: false`). `unmanaged`: Payload did not store it. */
      status: 'requestTime' | 'unmanaged'
    }

/** The document's own object for one role of a saved upload. */
export type UploadFileValue = {
  role: StoredFileRole
  value: Record<string, unknown>
}

export type StoredFileIdentity = Pick<StoredFile, 'key'>
