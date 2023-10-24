import type { SanitizedCollectionConfig } from '../../../collections/config/types'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { SanitizedGlobalConfig } from '../../../globals/config/types'

import { deepCopyObject } from '../../../utilities/deepCopyObject'
import { traverseFields } from './traverseFields'

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
