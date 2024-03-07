import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { Operation, PayloadRequest, RequestContext } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { promise } from './promise.js'

type Args = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  data: Record<string, unknown>
  doc: Record<string, unknown>
  docWithLocales: Record<string, unknown>
  errors: { field: string; message: string }[]
  fields: (Field | TabAsField)[]
  global: SanitizedGlobalConfig | null
  id?: number | string
  mergeLocaleActions: (() => void)[]
  operation: Operation
  path: string
  req: PayloadRequest
  siblingData: Record<string, unknown>
  siblingDoc: Record<string, unknown>
  siblingDocWithLocales: Record<string, unknown>
  skipValidation?: boolean
}

export const traverseFields = async ({
  id,
  collection,
  context,
  data,
  doc,
  docWithLocales,
  errors,
  fields,
  global,
  mergeLocaleActions,
  operation,
  path,
  req,
  siblingData,
  siblingDoc,
  siblingDocWithLocales,
  skipValidation,
}: Args): Promise<void> => {
  const promises = []

  fields.forEach((field) => {
    promises.push(
      promise({
        id,
        collection,
        context,
        data,
        doc,
        docWithLocales,
        errors,
        field,
        global,
        mergeLocaleActions,
        operation,
        path,
        req,
        siblingData,
        siblingDoc,
        siblingDocWithLocales,
        skipValidation,
      }),
    )
  })

  await Promise.all(promises)
}
