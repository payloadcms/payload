import type { Collection } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'
import type { ResolvedUploadDocument } from '../transformers/resolveUploadDocument.js'

import { NotFound } from '../../errors/NotFound.js'
import { checkFileAccess } from '../checkFileAccess.js'
import { isOriginalFileRequest } from '../isOriginalFileRequest.js'
import {
  getUploadFileEntries,
  getUploadFileObjects,
  hasStoredOriginal,
  withLegacyCloudUploadFileData,
} from './storedFiles.js'

type StoredVersion = {
  id: number | string
  parent: number | string
  version: JsonObject
}

export type HistoricalFile = {
  document: ResolvedUploadDocument
  /**
   * The requested entry is built at request time. `handleDynamicFileRequest` checks its file
   * access, so request parameters decide between an ordinary read and a transform check.
   */
  isBuiltAtRequest: boolean
}

/**
 * Resolves a version's exact file entry after checking version read access. A stored entry also
 * gets an ordinary read check of the parent here. An entry built at request time gets its file
 * access check where it is built.
 */
export const resolveHistoricalFile = async ({
  collection,
  filename,
  isOriginal,
  prefix,
  req,
  versionID,
}: {
  collection: Collection
  filename: string
  isOriginal?: boolean
  prefix?: string
  req: PayloadRequest
  versionID: string
}): Promise<HistoricalFile> => {
  const { docs } = await req.payload.db.findVersions<JsonObject>({
    collection: collection.config.slug,
    limit: 1,
    req,
    where: { id: { equals: versionID } },
  })
  const matched = docs[0]
  let historical: HistoricalFile | undefined
  let resolveFailure: { err: unknown } | undefined

  try {
    historical = matched
      ? await resolveVersionFile({ collection, filename, isOriginal, prefix, req, row: matched })
      : undefined
  } catch (err) {
    resolveFailure = { err }
  }

  // Check both policies before exposing a missing version, a filename mismatch or a damaged entry.
  if (!historical?.isBuiltAtRequest) {
    await checkFileAccess({ collection, documentID: matched?.parent, filename, req })
  }
  await req.payload.findVersionByID({
    id: versionID,
    collection: collection.config.slug,
    depth: 0,
    overrideAccess: false,
    req,
    showHiddenFields: true,
  })

  if (resolveFailure) {
    throw resolveFailure.err
  }

  if (!historical) {
    throw new NotFound(req.t)
  }

  return historical
}

const resolveVersionFile = async ({
  collection,
  filename,
  isOriginal,
  prefix,
  req,
  row,
}: {
  collection: Collection
  filename: string
  isOriginal?: boolean
  prefix?: string
  req: PayloadRequest
  row: StoredVersion
}): Promise<HistoricalFile | undefined> => {
  const saved = await withLegacyCloudUploadFileData({
    collection: collection.config,
    doc: row.version,
    req,
  })
  // A shared filename means the main file unless the request asks for the original.
  const values = getUploadFileObjects({ doc: saved })
  const match = isOriginalFileRequest({ doc: saved, filename, isOriginal })
    ? values.find(({ role }) => role.type === 'original')
    : values.find(({ role, value }) => role.type !== 'original' && value.filename === filename)

  // Find the requested file, then read only the entries it needs. Reading an entry throws for an
  // unsafe storage key, so a damaged entry elsewhere in the version must not fail this request.
  if (!match || (prefix !== undefined && (match.value.prefix ?? '') !== prefix)) {
    return
  }

  const [entry] = getUploadFileEntries({
    collection: collection.config,
    doc: saved,
    req,
    roles: [match.role],
  })
  const isBuiltAtRequest = entry?.status === 'requestTime'
  // A file built on request is built from the original, so only then is the original read too.
  const hasFile = isBuiltAtRequest
    ? hasStoredOriginal({
        entries: getUploadFileEntries({
          collection: collection.config,
          doc: saved,
          req,
          roles: [{ type: 'original' }],
        }),
      })
    : entry?.status === 'stored'

  if (!hasFile) {
    return
  }

  return { document: { ...saved, id: row.parent } as ResolvedUploadDocument, isBuiltAtRequest }
}
