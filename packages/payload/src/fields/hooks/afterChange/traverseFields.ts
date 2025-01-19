import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Field } from '../../config/types.js'

import { getFieldPaths } from '../../getFieldPaths.js'
import { promise } from './promise.js'

type Args = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  data: JsonObject
  doc: JsonObject
  fields: Field[]
  global: null | SanitizedGlobalConfig
  operation: 'create' | 'update'
  parentIndexPath: string
  parentPath: string
  parentSchemaPath: string
  previousDoc: JsonObject
  previousSiblingDoc: JsonObject
  req: PayloadRequest
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
  parentIndexPath,
  parentPath,
  parentSchemaPath,
  previousDoc,
  previousSiblingDoc,
  req,
  siblingData,
  siblingDoc,
}: Args): Promise<void> => {
  const promises = []

  fields.forEach((field, fieldIndex) => {
    const { indexPath, path, schemaPath } = getFieldPaths({
      field,
      index: fieldIndex,
      parentIndexPath: 'name' in field ? '' : parentIndexPath,
      parentPath,
      parentSchemaPath,
    })

    promises.push(
      promise({
        collection,
        context,
        data,
        doc,
        field,
        global,
        indexPath,
        operation,
        parentIndexPath,
        parentPath,
        parentSchemaPath,
        path,
        previousDoc,
        previousSiblingDoc,
        req,
        schemaPath,
        siblingData,
        siblingDoc,
      }),
    )
  })

  await Promise.all(promises)
}
