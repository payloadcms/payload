import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest, RequestContext } from '../../../express/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'

import deepCopyObject from '../../../utilities/deepCopyObject.js'
import { traverseFields } from './traverseFields.js'

type Args<T> = {
  context: RequestContext
  data: Record<string, unknown> | T
  doc?: Record<string, unknown> | T
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  id?: number | string
  operation: 'create' | 'update'
  overrideAccess: boolean
  req: PayloadRequest
}

export const beforeValidate = async <T extends Record<string, unknown>>({
  context,
  data: incomingData,
  doc,
  entityConfig,
  id,
  operation,
  overrideAccess,
  req,
}: Args<T>): Promise<T> => {
  const data = deepCopyObject(incomingData)

  await traverseFields({
    context,
    data,
    doc,
    fields: entityConfig.fields,
    id,
    operation,
    overrideAccess,
    req,
    siblingData: data,
    siblingDoc: doc,
  })

  return data
}
