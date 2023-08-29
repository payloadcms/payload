import type { PayloadRequest, RequestContext } from '../../../express/types.js'
import type { Operation } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { promise } from './promise.js'

type Args = {
  context: RequestContext
  data: Record<string, unknown>
  doc: Record<string, unknown>
  docWithLocales: Record<string, unknown>
  errors: { field: string; message: string }[]
  fields: (Field | TabAsField)[]
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
  context,
  data,
  doc,
  docWithLocales,
  errors,
  fields,
  id,
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
        context,
        data,
        doc,
        docWithLocales,
        errors,
        field,
        id,
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
