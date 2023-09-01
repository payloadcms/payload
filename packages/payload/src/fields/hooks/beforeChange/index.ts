import type { SanitizedCollectionConfig } from '../../../collections/config/types'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { SanitizedGlobalConfig } from '../../../globals/config/types'
import type { Operation } from '../../../types'

import { ValidationError } from '../../../errors'
import deepCopyObject from '../../../utilities/deepCopyObject'
import { traverseFields } from './traverseFields'

type Args<T> = {
  context: RequestContext
  data: Record<string, unknown> | T
  doc: Record<string, unknown> | T
  docWithLocales: Record<string, unknown>
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  id?: number | string
  operation: Operation
  req: PayloadRequest
  skipValidation?: boolean
}

export const beforeChange = async <T extends Record<string, unknown>>({
  context,
  data: incomingData,
  doc,
  docWithLocales,
  entityConfig,
  id,
  operation,
  req,
  skipValidation,
}: Args<T>): Promise<T> => {
  const data = deepCopyObject(incomingData)
  const mergeLocaleActions = []
  const errors: { field: string; message: string }[] = []

  await traverseFields({
    context,
    data,
    doc,
    docWithLocales,
    errors,
    fields: entityConfig.fields,
    id,
    mergeLocaleActions,
    operation,
    path: '',
    req,
    siblingData: data,
    siblingDoc: doc,
    siblingDocWithLocales: docWithLocales,
    skipValidation,
  })

  if (errors.length > 0) {
    throw new ValidationError(errors, req.t)
  }

  mergeLocaleActions.forEach((action) => action())

  return data
}
