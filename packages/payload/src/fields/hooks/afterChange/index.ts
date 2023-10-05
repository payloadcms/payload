import type { SanitizedCollectionConfig } from '../../../collections/config/types'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { SanitizedGlobalConfig } from '../../../globals/config/types'

import { deepCopyObject } from '../../../utilities/deepCopyObject'
import { traverseFields } from './traverseFields'

type Args<T> = {
  context: RequestContext
  data: Record<string, unknown> | T
  doc: Record<string, unknown> | T
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  operation: 'create' | 'update'
  previousDoc: Record<string, unknown> | T
  req: PayloadRequest
}

export const afterChange = async <T extends Record<string, unknown>>({
  context,
  data,
  doc: incomingDoc,
  entityConfig,
  operation,
  previousDoc,
  req,
}: Args<T>): Promise<T> => {
  const doc = deepCopyObject(incomingDoc)

  await traverseFields({
    context,
    data,
    doc,
    fields: entityConfig.fields,
    operation,
    previousDoc,
    previousSiblingDoc: previousDoc,
    req,
    siblingData: data,
    siblingDoc: doc,
  })

  return doc
}
