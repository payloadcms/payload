import type { SanitizedCollectionConfig } from '../../../collections/config/types'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { SanitizedGlobalConfig } from '../../../globals/config/types'
import type { Field, TabAsField } from '../../config/types'

import { promise } from './promise'

type Args<T> = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  data: T
  doc: T
  fields: (Field | TabAsField)[]
  global: SanitizedGlobalConfig | null
  id?: number | string
  operation: 'create' | 'update'
  overrideAccess: boolean
  req: PayloadRequest
  siblingData: Record<string, unknown>
  siblingDoc: Record<string, unknown>
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
  req,
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
