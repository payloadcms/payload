import type { SanitizedCollectionConfig } from '../../../collections/config/types'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { SanitizedGlobalConfig } from '../../../globals/config/types'

import { deepCopyObject } from '../../../utilities/deepCopyObject'
import { traverseFields } from './traverseFields'

type Args<T> = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  data: Record<string, unknown> | T
  doc?: Record<string, unknown> | T
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
