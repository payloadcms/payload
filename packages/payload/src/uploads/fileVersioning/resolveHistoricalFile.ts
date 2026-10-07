import type { Collection, TypeWithID } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'

import { Forbidden } from '../../errors/Forbidden.js'
import { NotFound } from '../../errors/NotFound.js'
import { checkFileAccess } from '../checkFileAccess.js'
import { collectStoredFiles, withLegacyCloudUploadFileData } from './storedFiles.js'

type StoredVersion = {
  id: number | string
  parent: number | string
  version: JsonObject
}

/** Finds an exact saved object reference, including sizes removed from the current config. */
export const resolveHistoricalFile = async ({
  collection,
  filename,
  prefix,
  req,
  versionID,
}: {
  collection: Collection
  filename: string
  prefix?: string
  req: PayloadRequest
  versionID: string
}): Promise<TypeWithID> => {
  const { docs } = await req.payload.db.findVersions<JsonObject>({
    collection: collection.config.slug,
    limit: 1,
    req,
    where: { id: { equals: versionID } },
  })
  const matched = docs[0]

  if (!matched) {
    throw new NotFound(req.t)
  }

  const historical = await resolveVersionFile({ collection, filename, prefix, req, row: matched })

  if (!historical) {
    throw new NotFound(req.t)
  }

  return historical
}

const resolveVersionFile = async ({
  collection,
  filename,
  prefix,
  req,
  row,
}: {
  collection: Collection
  filename: string
  prefix?: string
  req: PayloadRequest
  row: StoredVersion
}): Promise<TypeWithID | undefined> => {
  const saved = await withLegacyCloudUploadFileData({
    collection: collection.config,
    doc: row.version,
    req,
  })
  const hasFile = collectStoredFiles({ collection: collection.config, doc: saved, req }).some(
    (file) =>
      file.roles.some((role) => {
        const representation =
          role.type === 'size'
            ? (saved.variants as Record<string, JsonObject> | undefined)?.[role.sizeKey]
            : role.type === 'original'
              ? (saved.original as JsonObject | undefined)
              : saved
        return (
          representation?.filename === filename && (!prefix || representation.prefix === prefix)
        )
      }),
  )

  if (!hasFile) {
    return
  }

  await checkFileAccess({ collection, documentID: row.parent, filename, req })
  const authorized = await req.payload.findVersionByID({
    id: String(row.id),
    collection: collection.config.slug,
    depth: 0,
    overrideAccess: false,
    req,
    showHiddenFields: true,
  })

  if (!authorized) {
    throw new Forbidden(req.t)
  }

  return { ...saved, id: row.parent } as TypeWithID
}
