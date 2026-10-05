import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { JsonObject, Payload, PayloadRequest } from '../types/index.js'
import type { TypeWithVersion } from './types.js'

import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'
import { hasLocalizeStatusEnabled } from '../utilities/getVersionsConfig.js'
import { mergeLocalizedData } from '../utilities/mergeLocalizedData.js'

/**
 * Keep non-draft locales in the active snapshot current when the published document changes.
 * Draft queries filter, sort, and paginate this snapshot before read hooks run, so merging
 * published locale values only after the query would produce stale matches and counts.
 * Pending locale values and non-localized draft fields remain unchanged.
 */
export async function syncPublishedLocalesToDraft({
  collection,
  docWithLocales,
  draftVersion,
  global,
  payload,
  req,
}: {
  collection?: SanitizedCollectionConfig
  docWithLocales: JsonObject
  draftVersion: TypeWithVersion<JsonObject>
  global?: SanitizedGlobalConfig
  payload: Payload
  req?: PayloadRequest
}): Promise<JsonObject | undefined> {
  const entity = collection ?? global
  const { localization } = payload.config

  if (!entity || !localization || !hasLocalizeStatusEnabled(entity)) {
    return
  }

  const localesToUpdate = localization.localeCodes.filter(
    (code) => draftVersion.version._status?.[code] !== 'draft',
  )

  if (localesToUpdate.length === 0) {
    return
  }

  const version = deepCopyObjectSimple(
    mergeLocalizedData({
      configBlockReferences: payload.config.blocks,
      dataWithLocales: docWithLocales,
      docWithLocales: draftVersion.version,
      fields: entity.fields,
      localesToUpdate,
      preserveNonLocalized: true,
    }),
  )
  const args = {
    id: draftVersion.id,
    req,
    returning: false,
    versionData: {
      createdAt: draftVersion.createdAt,
      latest: draftVersion.latest,
      parent: draftVersion.parent,
      updatedAt: draftVersion.updatedAt,
      version,
    },
  }

  if (collection) {
    await payload.db.updateVersion({ ...args, collection: collection.slug })
  } else {
    await payload.db.updateGlobalVersion({ ...args, global: global!.slug })
  }

  return version
}
