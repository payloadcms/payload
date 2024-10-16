import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { JsonObject, Operation, PayloadRequest, RequestContext } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { promise } from './promise.js'

type Args = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  data: JsonObject
  /**
   * The original data (not modified by any hooks)
   */
  doc: JsonObject
  /**
   * The original data with locales (not modified by any hooks)
   */
  docWithLocales: JsonObject
  errors: { field: string; message: string }[]
  fields: (Field | TabAsField)[]
  global: null | SanitizedGlobalConfig
  id?: number | string
  mergeLocaleActions: (() => Promise<void>)[]
  operation: Operation
  path: (number | string)[]
  req: PayloadRequest
  schemaPath: string[]
  siblingData: JsonObject
  /**
   * The original siblingData (not modified by any hooks)
   */
  siblingDoc: JsonObject
  /**
   * The original siblingData with locales (not modified by any hooks)
   */
  siblingDocWithLocales: JsonObject
  skipValidation?: boolean
}

/**
 * This function is responsible for the following actions, in order:
 * - Run condition
 * - Execute field hooks
 * - Validate data
 * - Transform data for storage
 * - Unflatten locales. The input `data` is the normal document for one locale. The output result will become the document with locales.
 */
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
  schemaPath,
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
        parentPath: path,
        parentSchemaPath: schemaPath,
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
