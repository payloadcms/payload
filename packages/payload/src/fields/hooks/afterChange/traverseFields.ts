import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { JsonObject, PayloadRequest, RequestContext } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { promise } from './promise.js'

type Args = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  data: JsonObject
  doc: JsonObject
  fields: (Field | TabAsField)[]
  global: null | SanitizedGlobalConfig
  operation: 'create' | 'update'
  path: (number | string)[]
  previousDoc: JsonObject
  previousSiblingDoc: JsonObject
  req: PayloadRequest
  schemaPath: string[]
  siblingData: JsonObject
  siblingDoc: JsonObject
}

export const traverseFields = async ({
  collection,
  context,
  data,
  doc,
  fields,
  global,
  operation,
  path,
  previousDoc,
  previousSiblingDoc,
  req,
  schemaPath,
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
        parentPath: path,
        parentSchemaPath: schemaPath,
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
