import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { promise } from './promise.js'

type Args<T> = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  doc: T
  fields: (Field | TabAsField)[]
  id?: number | string
  overrideAccess: boolean
  path: (number | string)[]
  req: PayloadRequest
  schemaPath: string[]
  siblingDoc: JsonObject
}

export const traverseFields = async <T>({
  id,
  collection,
  context,
  doc,
  fields,
  overrideAccess,
  path,
  req,
  schemaPath,
  siblingDoc,
}: Args<T>): Promise<void> => {
  const promises = []
  fields.forEach((field, fieldIndex) => {
    promises.push(
      promise({
        id,
        collection,
        context,
        doc,
        field,
        fieldIndex,
        overrideAccess,
        parentPath: path,
        parentSchemaPath: schemaPath,
        req,
        siblingDoc,
      }),
    )
  })
  await Promise.all(promises)
}
