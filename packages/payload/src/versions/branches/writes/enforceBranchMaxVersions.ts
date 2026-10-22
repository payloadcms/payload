import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { PayloadRequest, Where } from '../../../types/index.js'

import {
  collectVersionFiles,
  scheduleUnreferencedFileCleanup,
} from '../../../uploads/fileVersioning/cleanup.js'

/** Protected roots do not consume the ordinary history allowance. Full concurrent GC is M6. */
export const enforceBranchMaxVersions = async ({
  id,
  collection,
  global,
  max,
  req,
}: {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: number | string
  max: number
  req: PayloadRequest
}): Promise<void> => {
  const config = (collection ?? global)!
  const pins = config.custom.branchStorage.pins as string
  let cursor: { id: number | string; updatedAt: string } | undefined
  let unprotectedCount = 0

  for (;;) {
    const where: Where = {
      and: [
        ...(collection ? [{ parent: { equals: id } }] : []),
        ...(cursor
          ? [
              {
                or: [
                  { updatedAt: { less_than: cursor.updatedAt } },
                  {
                    and: [
                      { updatedAt: { equals: cursor.updatedAt } },
                      { id: { less_than: cursor.id } },
                    ],
                  },
                ],
              },
            ]
          : []),
      ],
    }
    const args = { limit: 100, pagination: false, req, sort: ['-updatedAt', '-id'], where }
    const result = collection
      ? await req.payload.db.findVersions({ ...args, collection: collection.slug })
      : await req.payload.db.findGlobalVersions({ ...args, global: global!.slug })

    for (const row of result.docs) {
      const root = await req.payload.db.findOne({
        collection: pins,
        req,
        where: {
          and: [
            { versionID: { equals: row.id } },
            ...(collection ? [{ parent: { equals: id } }] : []),
          ],
        },
      })

      if (root || ++unprotectedCount <= max) {
        continue
      }
      const deleteWhere: Where = {
        and: [{ id: { equals: row.id } }, ...(collection ? [{ parent: { equals: id } }] : [])],
      }
      const removedFiles =
        collection?.upload && id !== undefined
          ? await collectVersionFiles({ collection, parentID: id, req, where: deleteWhere })
          : []

      await req.payload.db.deleteVersions({
        ...(collection ? { collection: collection.slug } : { globalSlug: global!.slug }),
        req,
        where: deleteWhere,
      })

      if (collection?.upload) {
        await scheduleUnreferencedFileCleanup({ candidates: removedFiles, collection, req })
      }
    }
    if (result.docs.length < 100) {
      return
    }
    const last = result.docs[result.docs.length - 1]!

    cursor = { id: last.id, updatedAt: last.updatedAt }
  }
}
