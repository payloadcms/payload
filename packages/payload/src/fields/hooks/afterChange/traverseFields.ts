import type { SanitizedCollectionConfig } from '../../../collections/config/types.d.ts'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.d.ts'
import type { PayloadRequest, RequestContext } from '../../../types/index.d.ts'
import type { Field, TabAsField } from '../../config/types.d.ts'

import { promise } from './promise.js'

type Args = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  data: Record<string, unknown>
  doc: Record<string, unknown>
  fields: (Field | TabAsField)[]
  global: SanitizedGlobalConfig | null
  operation: 'create' | 'update'
  previousDoc: Record<string, unknown>
  previousSiblingDoc: Record<string, unknown>
  req: PayloadRequest
  siblingData: Record<string, unknown>
  siblingDoc: Record<string, unknown>
}

export const traverseFields = async ({
  collection,
  context,
  data,
  doc,
  fields,
  global,
  operation,
  previousDoc,
  previousSiblingDoc,
  req,
  siblingData,
  siblingDoc,
}: Args): Promise<void> => {
  const promises = []

  fields.forEach((field) => {
    promises.push(
      promise({
        collection,
        context,
        data,
        doc,
        field,
        global,
        operation,
        previousDoc,
        previousSiblingDoc,
        req,
        siblingData,
        siblingDoc,
      }),
    )
  })

  await Promise.all(promises)
}
