import type { SanitizedCollectionConfig } from '../../../collections/config/types.d.ts'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.d.ts'
import type { PayloadRequest, RequestContext } from '../../../types/index.d.ts'

import { deepCopyObject } from '../../../utilities/deepCopyObject.js'
import { traverseFields } from './traverseFields.js'

type Args<T> = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  data: Record<string, unknown> | T
  doc: Record<string, unknown> | T
  global: SanitizedGlobalConfig | null
  operation: 'create' | 'update'
  previousDoc: Record<string, unknown> | T
  req: PayloadRequest
}

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
    previousDoc,
    previousSiblingDoc: previousDoc,
    req,
    siblingData: data,
    siblingDoc: doc,
  })

  return doc
}
