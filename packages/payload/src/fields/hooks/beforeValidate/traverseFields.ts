import type { SanitizedCollectionConfig } from '../../../collections/config/types.d.ts'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.d.ts'
import type { PayloadRequest, RequestContext } from '../../../types/index.d.ts'
import type { Field, TabAsField } from '../../config/types.d.ts'

import { promise } from './promise.js'

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
}: Args<T>): Promise<void> => {
  const promises = []
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
      }),
    )
  })
  await Promise.all(promises)
}
