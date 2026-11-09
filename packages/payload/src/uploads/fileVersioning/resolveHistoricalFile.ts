import type { Collection } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'
import type { ResolvedUploadDocument } from '../transformers/resolveUploadDocument.js'

import { NotFound } from '../../errors/NotFound.js'
import { checkFileAccess } from '../checkFileAccess.js'
import { isOriginalFileRequest } from '../isOriginalFileRequest.js'
import { isRequestTimeFile } from '../isRequestTimeFile.js'
import { collectStoredFiles, withLegacyCloudUploadFileData } from './storedFiles.js'

type StoredVersion = {
  id: number | string
  parent: number | string
  version: JsonObject
}

/** Resolves a version's exact file entry after checking parent and version read access. */
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
}): Promise<ResolvedUploadDocument> => {
  const { docs } = await req.payload.db.findVersions<JsonObject>({
    collection: collection.config.slug,
    limit: 1,
    req,
    where: { id: { equals: versionID } },
  })
  const matched = docs[0]

  // Check both policies before exposing a missing version or a filename mismatch. A historical
  // request ignores request parameters, so it is always an ordinary read.
  await checkFileAccess({ collection, documentID: matched?.parent, filename, req })
  await req.payload.findVersionByID({
    id: versionID,
    collection: collection.config.slug,
    depth: 0,
    overrideAccess: false,
    req,
    showHiddenFields: true,
  })

  if (!matched) {
    throw new NotFound(req.t)
  }

  const historical = await resolveVersionFile({
    collection,
    filename,
    isOriginal,
    prefix,
    req,
    row: matched,
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
}): Promise<ResolvedUploadDocument | undefined> => {
  const saved = await withLegacyCloudUploadFileData({
    collection: collection.config,
    doc: row.version,
    req,
  })
  const entry = getHistoricalEntry({ doc: saved, filename, isOriginal })

  if (!entry || (prefix !== undefined && (entry.value.prefix ?? '') !== prefix)) {
    return
  }

  const storedFiles = collectStoredFiles({ collection: collection.config, doc: saved, req })
  const hasFile = isRequestTimeFile({ entry: entry.value })
    ? storedFiles.some((file) => file.roles.some((role) => role.type === 'original'))
    : storedFiles.some((file) =>
        file.roles.some((role) =>
          entry.type === 'size'
            ? role.type === 'size' && role.sizeKey === entry.sizeKey
            : role.type === entry.type,
        ),
      )

  if (!hasFile) {
    return
  }

  return { ...saved, id: row.parent } as ResolvedUploadDocument
}

function getHistoricalEntry({
  doc,
  filename,
  isOriginal,
}: {
  doc: JsonObject
  filename: string
  isOriginal?: boolean
}): { sizeKey?: string; type: 'default' | 'original' | 'size'; value: JsonObject } | undefined {
  if (isOriginalFileRequest({ doc, filename, isOriginal })) {
    return { type: 'original', value: doc.original as JsonObject }
  }
  if (doc.filename === filename) {
    return { type: 'default', value: doc }
  }
  for (const [sizeKey, value] of Object.entries(
    (doc.variants ?? {}) as Record<string, JsonObject>,
  )) {
    if (value?.filename === filename) {
      return { type: 'size', sizeKey, value }
    }
  }
}
