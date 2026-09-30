import path from 'node:path'

import type { Collection, TypeWithID } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'
import type { ManagedFileManifest } from './types.js'

import { Forbidden } from '../../errors/Forbidden.js'
import { NotFound } from '../../errors/NotFound.js'
import { checkFileAccess } from '../checkFileAccess.js'
import { withLegacyUploadFileData } from './manifest.js'

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
  versionID?: string
}): Promise<TypeWithID> => {
  if (versionID) {
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

  let page = 1

  while (true) {
    const versions = await req.payload.db.findVersions<JsonObject>({
      collection: collection.config.slug,
      limit: 100,
      page,
      req,
    })

    for (const row of versions.docs) {
      const historical = await resolveVersionFile({ collection, filename, prefix, req, row })

      if (historical) {
        return historical
      }
    }

    if (versions.docs.length < 100) {
      break
    }
    page += 1
  }

  throw new NotFound(req.t)
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
  const saved = withLegacyUploadFileData({
    collection: collection.config,
    config: req.payload.config,
    doc: row.version,
  })
  const manifest = saved._managedFiles as ManagedFileManifest | undefined
  const hasFile = manifest?.some(
    (file) =>
      path.posix.basename(file.key) === filename &&
      (!prefix ||
        file.key === `${prefix}/${filename}` ||
        file.key.endsWith(`/${prefix}/${filename}`)),
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
