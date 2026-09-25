import type { CollectionConfig } from '../../collections/config/types.js'
import type { Config } from '../../config/types.js'
import type { OriginalFileData } from '../types.js'
import type {
  ManagedFileIdentity,
  ManagedFileManifest,
  ManagedFileReference,
  ManagedFileRole,
} from './types.js'

import { generateFilePathOrURL } from '../generateFilePathOrURL.js'
import { normalizeStorageKey } from './naming.js'

export const getManagedFileIdentity = ({ key, storageBackendId }: ManagedFileIdentity): string => {
  if (!storageBackendId || storageBackendId.trim() !== storageBackendId) {
    throw new Error('A managed file requires a configured storage backend ID')
  }

  return JSON.stringify([storageBackendId, normalizeStorageKey({ key })])
}

export const createManagedFileManifest = ({
  references,
}: {
  references: ManagedFileReference[]
}): ManagedFileManifest => {
  const files: ManagedFileManifest = []
  const fileByIdentity = new Map<string, ManagedFileManifest[number]>()

  for (const { key, role, storageBackendId } of references) {
    validateRole({ role })

    const normalizedKey = normalizeStorageKey({ key })
    const identity = getManagedFileIdentity({ key: normalizedKey, storageBackendId })
    let file = fileByIdentity.get(identity)

    if (!file) {
      file = { key: normalizedKey, roles: [], storageBackendId }
      fileByIdentity.set(identity, file)
      files.push(file)
    }

    if (!file.roles.some((existingRole) => isSameRole({ first: existingRole, second: role }))) {
      file.roles.push(role)
    }
  }

  return files
}

export const hasManagedFile = ({
  key,
  manifest,
  storageBackendId,
}: { manifest: ManagedFileManifest } & ManagedFileIdentity): boolean => {
  const identity = getManagedFileIdentity({ key, storageBackendId })

  return manifest.some((file) => getManagedFileIdentity(file) === identity)
}

export const synthesizeLegacyUploadState = ({
  collection,
  config,
  doc,
}: {
  collection: CollectionConfig
  config: Config
  doc: Record<string, unknown>
}): Record<string, unknown> => {
  const upload = typeof collection.upload === 'object' ? collection.upload : {}
  const filename = doc.filename
  const url = doc.url
  const filesize = doc.filesize
  const mimeType = doc.mimeType

  const hasStoredOriginal =
    doc.original &&
    typeof doc.original === 'object' &&
    !Array.isArray(doc.original) &&
    Object.values(doc.original).some((value) => value !== null && value !== undefined)

  if (hasStoredOriginal || Array.isArray(doc._managedFiles)) {
    return doc
  }

  if (
    typeof filename !== 'string' ||
    typeof url !== 'string' ||
    typeof filesize !== 'number' ||
    typeof mimeType !== 'string' ||
    upload.disableLocalStorage ||
    upload.adapter
  ) {
    return doc
  }

  const expectedURL = generateFilePathOrURL({
    collectionSlug: collection.slug,
    config,
    filename,
    relative: true,
    urlOrPath: undefined,
  })

  if (url !== expectedURL) {
    return doc
  }

  let key: string
  try {
    key = normalizeStorageKey({ key: filename })
  } catch {
    return doc
  }

  const original: OriginalFileData = {
    filename,
    filesize,
    mimeType,
    url,
  }
  if (typeof doc.width === 'number') {
    original.width = doc.width
  }
  if (typeof doc.height === 'number') {
    original.height = doc.height
  }

  const storageBackendId = `local:${collection.slug}`
  const references: ManagedFileReference[] = [
    { key, role: { type: 'original' }, storageBackendId },
    { key, role: { type: 'default' }, storageBackendId },
  ]

  if (doc.sizes && typeof doc.sizes === 'object' && !Array.isArray(doc.sizes)) {
    for (const [sizeKey, size] of Object.entries(doc.sizes)) {
      if (!size || typeof size !== 'object' || Array.isArray(size)) {
        continue
      }

      const storedSize = size as Record<string, unknown>
      if (typeof storedSize.filename !== 'string' || typeof storedSize.url !== 'string') {
        continue
      }

      const expectedSizeURL = generateFilePathOrURL({
        collectionSlug: collection.slug,
        config,
        filename: storedSize.filename,
        relative: true,
        urlOrPath: undefined,
      })
      if (storedSize.url !== expectedSizeURL) {
        continue
      }

      try {
        references.push({
          key: normalizeStorageKey({ key: storedSize.filename }),
          role: { type: 'size', sizeKey },
          storageBackendId,
        })
      } catch {
        continue
      }
    }
  }

  return {
    ...doc,
    _managedFiles: createManagedFileManifest({ references }),
    original,
  }
}

const isSameRole = ({ first, second }: { first: ManagedFileRole; second: ManagedFileRole }) =>
  first.type === second.type &&
  (first.type !== 'size' || (second.type === 'size' && first.sizeKey === second.sizeKey))

const validateRole = ({ role }: { role: ManagedFileRole }): void => {
  if (role.type === 'size' && (!role.sizeKey || role.sizeKey.includes('/'))) {
    throw new Error('A managed size requires a safe size key')
  }
}
