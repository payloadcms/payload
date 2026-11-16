import type { Collection } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'
import type { ResolvedUploadDocument } from '../transformers/resolveUploadDocument.js'

import { NotFound } from '../../errors/NotFound.js'
import { checkFileAccess } from '../checkFileAccess.js'
import { isOriginalFileRequest } from '../isOriginalFileRequest.js'
import {
  getUploadFileEntries,
  getUploadFileValues,
  hasStoredOriginal,
  isSameFileRole,
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
  const historical = matched
    ? await resolveVersionFile({ collection, filename, isOriginal, prefix, req, row: matched })
    : undefined

  // Check both policies before exposing a missing version or a filename mismatch.
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
  const values = getUploadFileValues({ doc: saved })
  const match = isOriginalFileRequest({ doc: saved, filename, isOriginal })
    ? values.find(({ role }) => role.type === 'original')
    : values.find(({ role, value }) => role.type !== 'original' && value.filename === filename)

  // Find the requested file before reading the version's entries. Reading them can throw for a
  // damaged entry, and that must not happen before the access checks for another file.
  if (!match || (prefix !== undefined && (match.value.prefix ?? '') !== prefix)) {
    return
  }

  const entries = getUploadFileEntries({ collection: collection.config, doc: saved, req })
  const entry = entries.find(({ role }) => isSameFileRole({ first: role, second: match.role }))
  const isBuiltAtRequest = entry?.status === 'requestTime'
  const hasFile = isBuiltAtRequest ? hasStoredOriginal({ entries }) : entry?.status === 'stored'

  if (!hasFile) {
    return
  }

  return { document: { ...saved, id: row.parent } as ResolvedUploadDocument, isBuiltAtRequest }
}
