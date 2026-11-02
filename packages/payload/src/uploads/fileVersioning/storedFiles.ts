import type { CollectionConfig, SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Config } from '../../config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { OriginalFileData } from '../types.js'
import type {
  StoredFileIdentity,
  StoredFileList,
  StoredFileReference,
  StoredFileRole,
} from './types.js'

import { generateFilePathOrURL } from '../generateFilePathOrURL.js'
import { normalizeStorageKey } from './naming.js'

export const getStoredFileIdentity = ({ key }: StoredFileIdentity): string =>
  normalizeStorageKey({ key })

const createStoredFileList = ({
  references,
}: {
  references: StoredFileReference[]
}): StoredFileList => {
  const files: StoredFileList = []
  const fileByIdentity = new Map<string, StoredFileList[number]>()

  for (const { key, role } of references) {
    validateRole({ role })

    const normalizedKey = normalizeStorageKey({ key })
    const identity = getStoredFileIdentity({ key: normalizedKey })
    let file = fileByIdentity.get(identity)

    if (!file) {
      file = { key: normalizedKey, roles: [] }
      fileByIdentity.set(identity, file)
      files.push(file)
    }

    if (!file.roles.some((existingRole) => isSameRole({ first: existingRole, second: role }))) {
      file.roles.push(role)
    }
  }

  return files
}

/** Builds the file list from the locations saved on each stored representation. */
export const collectStoredFiles = ({
  collection,
  doc,
  req,
  trustGenerated = false,
}: {
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown>
  req: PayloadRequest
  trustGenerated?: boolean
}): StoredFileList => {
  const upload = collection.upload
  const operations = upload.fileOperations
  const references: StoredFileReference[] = []
  const add = (value: unknown, role: StoredFileRole) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return
    }
    const representation = value as Record<string, unknown>
    if (typeof representation.filename !== 'string') {
      return
    }
    const filename = representation.filename
    if (
      !operations &&
      !trustGenerated &&
      representation.url !==
        generateFilePathOrURL({
          collectionSlug: collection.slug,
          config: req.payload.config,
          filename,
          relative: true,
          urlOrPath: undefined,
        })
    ) {
      return
    }
    const prefix = typeof representation.prefix === 'string' ? representation.prefix : undefined
    const _objectKey =
      typeof representation._objectKey === 'string' ? representation._objectKey : undefined
    const key = operations
      ? operations.resolveStorageKey({ _objectKey, filename, prefix })
      : filename
    references.push({ key, role })
  }

  // Older uploads without an original have not been identified as Payload-managed.
  if (
    !doc.original ||
    typeof doc.original !== 'object' ||
    typeof (doc.original as Record<string, unknown>).filename !== 'string'
  ) {
    return []
  }
  add(doc, { type: 'default' })
  add(doc.original, { type: 'original' })
  if (doc.variants && typeof doc.variants === 'object' && !Array.isArray(doc.variants)) {
    for (const [sizeKey, value] of Object.entries(doc.variants)) {
      add(value, { type: 'size', sizeKey })
    }
  }
  return createStoredFileList({ references })
}

export const withLegacyUploadFileData = ({
  collection,
  config,
  doc,
}: {
  collection: CollectionConfig
  config: Pick<Config, 'routes' | 'serverURL'>
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

  if (hasStoredOriginal) {
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

  try {
    normalizeStorageKey({ key: filename })
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

  return {
    ...doc,
    original,
  }
}

export const withLegacyCloudUploadFileData = async <T extends Record<string, unknown>>({
  collection,
  doc,
  req,
}: {
  collection: CollectionConfig
  doc: T
  req: PayloadRequest
}): Promise<T> => {
  const stored = withLegacyUploadFileData({ collection, config: req.payload.config, doc })
  const operations =
    typeof collection.upload === 'object' ? collection.upload.fileOperations : undefined

  if (
    (stored.original &&
      typeof stored.original === 'object' &&
      typeof (stored.original as Record<string, unknown>).filename === 'string') ||
    !operations?.hasLegacyFile ||
    typeof stored.filename !== 'string' ||
    typeof stored.url !== 'string' ||
    typeof stored.filesize !== 'number' ||
    typeof stored.mimeType !== 'string'
  ) {
    return stored as T
  }

  if (!(await operations.hasLegacyFile({ doc: stored, req }))) {
    return stored as T
  }

  const variants =
    stored.variants && typeof stored.variants === 'object'
      ? Object.fromEntries(
          Object.entries(stored.variants).map(([name, value]) => [
            name,
            value && typeof value === 'object'
              ? { ...value, _objectKey: stored._objectKey, prefix: stored.prefix }
              : value,
          ]),
        )
      : stored.variants

  return Object.assign({}, doc, stored, {
    original: {
      _objectKey: stored._objectKey,
      filename: stored.filename,
      filesize: stored.filesize,
      height: stored.height,
      mimeType: stored.mimeType,
      prefix: stored.prefix,
      url: stored.url,
      width: stored.width,
    },
    variants,
  })
}

const isSameRole = ({ first, second }: { first: StoredFileRole; second: StoredFileRole }) =>
  first.type === second.type &&
  (first.type !== 'size' || (second.type === 'size' && first.sizeKey === second.sizeKey))

const validateRole = ({ role }: { role: StoredFileRole }): void => {
  if (role.type === 'size' && (!role.sizeKey || role.sizeKey.includes('/'))) {
    throw new Error('A stored variant requires a safe size key')
  }
}
