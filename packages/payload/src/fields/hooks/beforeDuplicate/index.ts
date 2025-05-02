// @ts-strict-ignore
import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'

import { traverseFields } from './traverseFields.js'

type Args<T extends JsonObject> = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  doc?: T
  id?: number | string
  overrideAccess: boolean
  req: PayloadRequest
}

/**
 * This function is responsible for running beforeDuplicate hooks
 * against a document including all locale data.
 * It will run each field's beforeDuplicate hook
 * and return the resulting docWithLocales.
 */
export const beforeDuplicate = async <T extends JsonObject>({
  id,
  collection,
  context,
  doc,
  overrideAccess,
  req,
}: Args<T>): Promise<T> => {
  await traverseFields({
    id,
    collection,
    context,
    doc,
    fields: collection?.fields,
    overrideAccess,
    parentIndexPath: '',
    parentIsLocalized: false,
    parentPath: '',
    parentSchemaPath: '',
    req,
    siblingDoc: doc,
  })

  return doc
}
