import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Field } from '../../config/types.js'

import { getFieldPaths } from '../../getFieldPaths.js'
import { promise } from './promise.js'

type Args<T> = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  doc: T
  fields: Field[]
  id?: number | string
  overrideAccess: boolean
  parentIndexPath: string
  parentPath: string
  parentSchemaPath: string
  req: PayloadRequest
  siblingDoc: JsonObject
}

export const traverseFields = async <T>({
  id,
  collection,
  context,
  doc,
  fields,
  overrideAccess,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
  req,
  siblingDoc,
}: Args<T>): Promise<void> => {
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
        id,
        collection,
        context,
        doc,
        field,
        indexPath,
        overrideAccess,
        parentIndexPath,
        parentPath,
        parentSchemaPath,
        path,
        req,
        schemaPath,
        siblingDoc,
      }),
    )
  })
  await Promise.all(promises)
}
