import type { SanitizedCollectionConfig } from '../../../collections/config/types'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { SanitizedGlobalConfig } from '../../../globals/config/types'

import deepCopyObject from '../../../utilities/deepCopyObject'
import { traverseFields } from './traverseFields'

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
