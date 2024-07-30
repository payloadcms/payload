import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { JsonObject, PayloadRequest, RequestContext } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { promise } from './promise.js'

type Args<T> = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  data: T
  /**
   * The original data (not modified by any hooks)
   */
  doc: T
  fields: (Field | TabAsField)[]
  global: SanitizedGlobalConfig | null
  id?: number | string
  operation: 'create' | 'update'
  overrideAccess: boolean
  path: (number | string)[]
  req: PayloadRequest
  schemaPath: string[]
  siblingData: JsonObject
  /**
   * The original siblingData (not modified by any hooks)
   */
  siblingDoc: JsonObject
  siblingDocKeys?: Set<string>
}

export const traverseFields = async <T>({
  id,
  collection,
  context,
  data,
  doc,
  fields,
  global,
  operation,
  overrideAccess,
  path,
  req,
  schemaPath,
  siblingData,
  siblingDoc,
  siblingDocKeys: incomingSiblingDocKeys,
}: Args<T>): Promise<void> => {
  const promises = []
  const siblingDocKeys = incomingSiblingDocKeys || new Set(Object.keys(siblingDoc))

  fields.forEach((field) => {
    promises.push(
      promise({
        id,
        collection,
        context,
        data,
        doc,
        field,
        global,
        operation,
        overrideAccess,
        parentPath: path,
        parentSchemaPath: schemaPath,
        req,
        siblingData,
        siblingDoc,
        siblingDocKeys,
      }),
    )
  })
  await Promise.all(promises)

  // For any siblingDocKeys that have not been deleted,
  // we will move the data to the siblingData object
  // to preserve it
  siblingDocKeys.forEach((key) => {
    if (!['createdAt', 'globalType', 'id', 'updatedAt'].includes(key)) {
      siblingData[key] = siblingDoc[key]
    }
  })
}
