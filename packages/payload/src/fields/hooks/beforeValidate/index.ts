import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { PayloadRequest, RequestContext } from '../../../types/index.js'

import { deepCopyObject } from '../../../utilities/deepCopyObject.js'
import { traverseFields } from './traverseFields.js'

type Args<T> = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  data: Record<string, unknown> | T
  doc?: Record<string, unknown> | T
  duplicate?: boolean
  global: SanitizedGlobalConfig | null
  id?: number | string
  operation: 'create' | 'update'
  overrideAccess: boolean
  req: PayloadRequest
}

export const beforeValidate = async <T extends Record<string, unknown>>({
  id,
  collection,
  context,
  data: incomingData,
  doc,
  duplicate = false,
  global,
  operation,
  overrideAccess,
  req,
}: Args<T>): Promise<T> => {
  const data = deepCopyObject(incomingData)

  await traverseFields({
    id,
    collection,
    context,
    data,
    doc,
    duplicate,
    fields: collection?.fields || global?.fields,
    global,
    operation,
    overrideAccess,
    req,
    siblingData: data,
    siblingDoc: doc,
  })

  return data
}
