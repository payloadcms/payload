import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { PayloadRequest, RequestContext } from '../../../types/index.js'

import { deepCopyObject } from '../../../utilities/deepCopyObject.js'
import { traverseFields } from './traverseFields.js'

type Args<T> = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  /**
   * The data before hooks
   */
  data: Record<string, unknown> | T
  /**
   * The data after hooks
   */
  doc: Record<string, unknown> | T
  global: SanitizedGlobalConfig | null
  operation: 'create' | 'update'
  previousDoc: Record<string, unknown> | T
  req: PayloadRequest
}

/**
 * This function is responsible for the following actions, in order:
 * - Execute field hooks
 */
export const afterChange = async <T extends Record<string, unknown>>({
  collection,
  context,
  data,
  doc: incomingDoc,
  global,
  operation,
  previousDoc,
  req,
}: Args<T>): Promise<T> => {
  const doc = deepCopyObject(incomingDoc)

  await traverseFields({
    collection,
    context,
    data,
    doc,
    fields: collection?.fields || global?.fields,
    global,
    operation,
    path: [],
    previousDoc,
    previousSiblingDoc: previousDoc,
    req,
    schemaPath: [],
    siblingData: data,
    siblingDoc: doc,
  })

  return doc
}
