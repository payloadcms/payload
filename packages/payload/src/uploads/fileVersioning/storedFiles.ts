import type { CollectionConfig, SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Config } from '../../config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { OriginalFileData } from '../types.js'
import type {
  StoredFile,
  StoredFileIdentity,
  StoredFileList,
  StoredFileRole,
  UploadFileEntry,
  UploadFileValue,
} from './types.js'

import { generateFilePathOrURL } from '../generateFilePathOrURL.js'
import { shouldRequestOriginal } from '../isOriginalFileRequest.js'
import { isRequestTimeFile } from '../isRequestTimeFile.js'
import { normalizeStorageKey } from './naming.js'

type UploadFileEntriesArgs = {
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown>
  req: PayloadRequest
  /** Treat local entries as Payload-managed without checking their URL, for a next state Payload built. */
  trustGenerated?: boolean
}

export const getStoredFileIdentity = ({ key }: StoredFileIdentity): string =>
  normalizeStorageKey({ key })

/**
 * Lists the saved objects of the main file, the original and each size, in that order. Values
 * that are not objects are left out. Each value is the document's own object, not a copy.
 */
export const getUploadFileValues = ({
  doc,
}: {
  doc: Record<string, unknown>
}): UploadFileValue[] => {
  const variants = isEntryObject(doc.variants) ? Object.entries(doc.variants) : []
  const values: { role: StoredFileRole; value: unknown }[] = [
    { role: { type: 'default' }, value: doc },
    { role: { type: 'original' }, value: doc.original },
    ...variants.map(([sizeKey, value]) => ({
      role: { type: 'size', sizeKey } as const,
      value,
    })),
  ]

  return values.filter((entry): entry is UploadFileValue => isEntryObject(entry.value))
}

/** The document's own object for one role, so a caller can change that entry. */
export const getUploadFileValue = ({
  doc,
  role,
}: {
  doc: Record<string, unknown>
  role: StoredFileRole
}): Record<string, unknown> | undefined =>
  getUploadFileValues({ doc }).find((entry) => isSameFileRole({ first: entry.role, second: role }))
    ?.value

export const isSameFileRole = ({
  first,
  second,
}: {
  first: StoredFileRole
  second: StoredFileRole
}): boolean =>
  first.type === second.type &&
  (first.type !== 'size' || (second.type === 'size' && first.sizeKey === second.sizeKey))

/** Older uploads without an original have not been identified as Payload-managed. */
export const hasManagedOriginal = ({ doc }: { doc: Record<string, unknown> }): boolean =>
  isEntryObject(doc.original) && typeof doc.original.filename === 'string'

/**
 * Lists the main file, the original and each size of a saved upload, one entry per role. Each
 * entry says whether Payload stores it, builds it on request, or does not manage it. Run
 * `withLegacyUploadFileData` or `withLegacyCloudUploadFileData` first for older documents.
 */
export const getUploadFileEntries = ({
  collection,
  doc,
  req,
  trustGenerated = false,
}: UploadFileEntriesArgs): UploadFileEntry[] => {
  const isManagedUpload = hasManagedOriginal({ doc })

  return getUploadFileValues({ doc }).flatMap(({ role, value }): UploadFileEntry[] => {
    if (typeof value.filename !== 'string') {
      return []
    }

    const filename = value.filename

    // A `_stored: false` entry is built when it is requested, so it has no object to copy or delete.
    // An original is never built on request, so Payload does not manage one with that marker.
    if (isRequestTimeFile({ entry: value })) {
      return [{ filename, role, status: role.type === 'original' ? 'unmanaged' : 'requestTime' }]
    }

    if (
      !isManagedUpload ||
      (!collection.upload.fileOperations &&
        !trustGenerated &&
        !hasPayloadFileURL({ collection, doc, entry: value, filename, req, role }))
    ) {
      return [{ filename, role, status: 'unmanaged' }]
    }

    validateRole({ role })

    return [
      {
        filename,
        key: resolveStorageKey({ collection, entry: value, filename }),
        role,
        status: 'stored',
      },
    ]
  })
}

/** Lists the stored objects of a saved upload. An object shared by several roles is listed once. */
export const collectStoredFiles = (args: UploadFileEntriesArgs): StoredFileList => {
  const files: StoredFileList = []
  const fileByIdentity = new Map<string, StoredFile>()

  for (const entry of getUploadFileEntries(args)) {
    if (entry.status !== 'stored') {
      continue
    }

    const identity = getStoredFileIdentity({ key: entry.key })
    const file = fileByIdentity.get(identity)

    if (file) {
      file.roles.push(entry.role)
    } else {
      const newFile = { key: entry.key, roles: [entry.role] }
      fileByIdentity.set(identity, newFile)
      files.push(newFile)
    }
  }

  return files
}

/** Whether the original is stored, so a request-time file can be built from it. */
export const hasStoredOriginal = ({ entries }: { entries: UploadFileEntry[] }): boolean =>
  entries.some(({ role, status }) => status === 'stored' && role.type === 'original')

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

  const hasOriginalData =
    doc.original &&
    typeof doc.original === 'object' &&
    !Array.isArray(doc.original) &&
    Object.values(doc.original).some((value) => value !== null && value !== undefined)

  if (hasOriginalData) {
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
    hasManagedOriginal({ doc: stored }) ||
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

const isEntryObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

/** Without a storage adapter, an entry is Payload-managed only when its URL is Payload's file route. */
const hasPayloadFileURL = ({
  collection,
  doc,
  entry,
  filename,
  req,
  role,
}: {
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown>
  entry: Record<string, unknown>
  filename: string
  req: PayloadRequest
  role: StoredFileRole
}): boolean => {
  const getFileURL = ({ isOriginal }: { isOriginal: boolean }) =>
    generateFilePathOrURL({
      collectionSlug: collection.slug,
      config: req.payload.config,
      filename,
      isOriginal,
      relative: true,
      urlOrPath: undefined,
    })

  if (
    entry.url ===
    getFileURL({ isOriginal: role.type === 'original' && shouldRequestOriginal({ doc }) })
  ) {
    return true
  }

  // Archiving can rename the original away from the main file while retaining its role query.
  return role.type === 'original' && entry.url === getFileURL({ isOriginal: true })
}

const resolveStorageKey = ({
  collection,
  entry,
  filename,
}: {
  collection: SanitizedCollectionConfig
  entry: Record<string, unknown>
  filename: string
}): string => {
  const operations = collection.upload.fileOperations
  const key = operations
    ? operations.resolveStorageKey({
        _objectKey: typeof entry._objectKey === 'string' ? entry._objectKey : undefined,
        filename,
        prefix: typeof entry.prefix === 'string' ? entry.prefix : undefined,
      })
    : filename

  return normalizeStorageKey({ key })
}

const validateRole = ({ role }: { role: StoredFileRole }): void => {
  if (role.type === 'size' && (!role.sizeKey || role.sizeKey.includes('/'))) {
    throw new Error('A stored variant requires a safe size key')
  }
}
