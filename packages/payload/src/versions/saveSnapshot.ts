import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Payload, TypeWithVersion } from '../index.js'
import type { JsonObject, PayloadRequest, SelectType } from '../types/index.js'

import { deepCopyObjectSimple } from '../index.js'
import { getQueryDraftsSelect } from './drafts/getQueryDraftsSelect.js'

type Args = {
  autosave?: boolean
  collection?: SanitizedCollectionConfig
  data?: JsonObject
  global?: SanitizedGlobalConfig
  id?: number | string
  payload: Payload
  publishSpecificLocale?: string
  req?: PayloadRequest
  select?: SelectType
}

export const saveSnapshot = async <T extends JsonObject = JsonObject>({
  id,
  autosave,
  collection,
  data,
  global,
  payload,
  publishSpecificLocale,
  req,
  select,
}: Args): Promise<Omit<TypeWithVersion<T>, 'parent'> | TypeWithVersion<T> | undefined> => {
  const docData: JsonObject = deepCopyObjectSimple(data || {})
  docData._status = 'draft'

  if (docData._id) {
    delete docData._id
  }

  const snapshotDate = new Date().toISOString()

  const sharedCreateVersionArgs = {
    autosave: Boolean(autosave),
    createdAt: snapshotDate,
    publishedLocale: publishSpecificLocale || undefined,
    req,
    returning: false,
    select: getQueryDraftsSelect({ select }),
    updatedAt: snapshotDate,
    versionData: docData as T,
  }

  if (collection && id) {
    return payload.db.createVersion<T>({
      ...sharedCreateVersionArgs,
      collectionSlug: collection.slug,
      parent: id,
      snapshot: true,
    })
  }
  if (global) {
    return payload.db.createGlobalVersion<T>({
      ...sharedCreateVersionArgs,
      globalSlug: global.slug,
      snapshot: true,
    })
  }
}
