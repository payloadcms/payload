import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { Field, TabAsField } from '../../config/types'

import { promise } from './promise'

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
  id,
  context,
  data,
  doc,
  fields,
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
        context,
        data,
        doc,
        field,
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
