import type { PayloadRequest, RequestContext } from '../../../express/types.js'
import type { Field, TabAsField } from '../../config/types.js'

import { promise } from './promise.js'

type Args<T> = {
  context: RequestContext
  data: T
  doc: T
  fields: (Field | TabAsField)[]
  id?: number | string
  operation: 'create' | 'update'
  overrideAccess: boolean
  req: PayloadRequest
  siblingData: Record<string, unknown>
  siblingDoc: Record<string, unknown>
}

export const traverseFields = async <T>({
  context,
  data,
  doc,
  fields,
  id,
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
        context,
        data,
        doc,
        field,
        id,
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
