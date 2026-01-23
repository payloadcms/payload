import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { ParentFieldPaths, RequestContext } from '../../../index.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { promise } from './promise.js'

type Args<T> = {
  /**
   * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
   */
  blockData?: JsonObject
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  doc: T
  fields: (Field | TabAsField)[]
  id?: number | string
  overrideAccess: boolean
  parentIsLocalized: boolean
  req: PayloadRequest
  siblingDoc: JsonObject
} & Required<ParentFieldPaths>

export const traverseFields = async <T>({
  id,
  blockData,
  collection,
  context,
  doc,
  fields,
  overrideAccess,
  parentIndexPath,
  parentIsLocalized,
  parentPath,
  parentSchemaPath,
  req,
  siblingDoc,
}: Args<T>): Promise<void> => {
  const promises: Promise<void>[] = []

  fields.forEach((field, fieldIndex) => {
    promises.push(
      promise({
        id,
        blockData,
        collection,
        context,
        doc,
        field,
        fieldIndex,
        overrideAccess,
        parentIndexPath,
        parentIsLocalized,
        parentPath,
        parentSchemaPath,
        req,
        siblingDoc,
        siblingFields: fields,
      }),
    )
  })
  await Promise.all(promises)
}
