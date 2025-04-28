// @ts-strict-ignore
import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { ValidationFieldError } from '../../../errors/index.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, Operation, PayloadRequest } from '../../../types/index.js'

import { ValidationError } from '../../../errors/index.js'
import { deepCopyObjectSimple } from '../../../utilities/deepCopyObject.js'
import { traverseFields } from './traverseFields.js'
export type Args<T extends JsonObject> = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  data: T
  doc: T
  docWithLocales: JsonObject
  global: null | SanitizedGlobalConfig
  id?: number | string
  operation: Operation
  req: PayloadRequest
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

export const beforeChange = async <T extends JsonObject>({
  id,
  collection,
  context,
  data: incomingData,
  doc,
  docWithLocales,
  global,
  operation,
  req,
  skipValidation,
}: Args<T>): Promise<T> => {
  const data = deepCopyObjectSimple(incomingData)
  const mergeLocaleActions = []
  const errors: ValidationFieldError[] = []

  await traverseFields({
    id,
    collection,
    context,
    data,
    doc,
    docWithLocales,
    errors,
    fieldLabelPath: '',
    fields: collection?.fields || global?.fields,
    global,
    mergeLocaleActions,
    operation,
    parentIndexPath: '',
    parentIsLocalized: false,
    parentPath: '',
    parentSchemaPath: '',
    req,
    siblingData: data,
    siblingDoc: doc,
    siblingDocWithLocales: docWithLocales,
    skipValidation,
  })

  if (errors.length > 0) {
    throw new ValidationError(
      {
        id,
        collection: collection?.slug,
        errors,
        global: global?.slug,
        req,
      },
      req.t,
    )
  }

  for (const action of mergeLocaleActions) {
    await action()
  }

  return data
}
