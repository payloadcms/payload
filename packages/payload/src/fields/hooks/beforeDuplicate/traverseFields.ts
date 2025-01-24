import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { getFieldPathsModified } from '../../getFieldPaths.js'
import { promise } from './promise.js'

type Args<T> = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  doc: T
  fields: (Field | TabAsField)[]
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
    const { indexPath, path, schemaPath } = getFieldPathsModified({
      field,
      index: fieldIndex,
      parentIndexPath,
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
        path,
        req,
        schemaPath,
        siblingDoc,
      }),
    )
  })
  await Promise.all(promises)
}
