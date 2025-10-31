import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type {
  CreateGlobalVersionArgs,
  CreateVersionArgs,
  Payload,
  TypeWithVersion,
} from '../index.js'
import type { JsonObject, PayloadRequest, SelectType } from '../types/index.js'

import { deepCopyObjectSimple } from '../index.js'
import { getQueryDraftsSelect } from './drafts/getQueryDraftsSelect.js'

type Args<T extends JsonObject = JsonObject> = {
  autosave?: boolean
  collection?: SanitizedCollectionConfig
  data?: T
  global?: SanitizedGlobalConfig
  id?: number | string
  payload: Payload
  publishSpecificLocale?: string
  req?: PayloadRequest
  select?: SelectType
  unpublishSpecificLocale?: string
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
  unpublishSpecificLocale,
}: Args<T>): Promise<Omit<TypeWithVersion<T>, 'parent'> | TypeWithVersion<T> | undefined> => {
  const docData: {
    _status?: 'draft'
  } & T = deepCopyObjectSimple<T>(data || ({} as T))
  docData._status = 'draft'

  if (docData._id) {
    delete docData._id
  }

  const snapshotDate = new Date().toISOString()

  const sharedCreateVersionArgs: Omit<
    CreateGlobalVersionArgs<T> | CreateVersionArgs<T>,
    'collectionSlug' | 'globalSlug'
  > = {
    autosave: Boolean(autosave),
    createdAt: snapshotDate,
    publishedLocale: publishSpecificLocale || undefined,
    req,
    returning: false,
    select: getQueryDraftsSelect({ select }),
    snapshot: true,
    unpublishedLocale: unpublishSpecificLocale || undefined,
    updatedAt: snapshotDate,
    versionData: docData,
  }

  if (collection && id) {
    return payload.db.createVersion<T>({
      ...sharedCreateVersionArgs,
      collectionSlug: collection.slug,
      parent: id,
    })
  }
  if (global) {
    return payload.db.createGlobalVersion<T>({
      ...sharedCreateVersionArgs,
      globalSlug: global.slug,
    })
  }
}
