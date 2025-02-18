// @ts-strict-ignore
import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { promise } from './promise.js'

type Args = {
  /**
   * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
   */
  blockData?: JsonObject
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  data: JsonObject
  doc: JsonObject
  fields: (Field | TabAsField)[]
  global: null | SanitizedGlobalConfig
  operation: 'create' | 'update'
  parentIndexPath: string
  /**
   * @todo make required in v4.0
   */
  parentIsLocalized?: boolean
  parentPath: string
  parentSchemaPath: string
  previousDoc: JsonObject
  previousSiblingDoc: JsonObject
  req: PayloadRequest
  siblingData: JsonObject
  siblingDoc: JsonObject
  siblingFields?: (Field | TabAsField)[]
}

export const traverseFields = async ({
  blockData,
  collection,
  context,
  data,
  doc,
  fields,
  global,
  operation,
  parentIndexPath,
  parentIsLocalized,
  parentPath,
  parentSchemaPath,
  previousDoc,
  previousSiblingDoc,
  req,
  siblingData,
  siblingDoc,
  siblingFields,
}: Args): Promise<void> => {
  const promises = []

  fields.forEach((field, fieldIndex) => {
    promises.push(
      promise({
        blockData,
        collection,
        context,
        data,
        doc,
        field,
        fieldIndex,
        global,
        operation,
        parentIndexPath,
        parentIsLocalized,
        parentPath,
        parentSchemaPath,
        previousDoc,
        previousSiblingDoc,
        req,
        siblingData,
        siblingDoc,
        siblingFields,
      }),
    )
  })

  await Promise.all(promises)
}
