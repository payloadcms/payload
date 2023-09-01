import type { SanitizedCollectionConfig } from '../../../collections/config/types'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { SanitizedGlobalConfig } from '../../../globals/config/types'

import deepCopyObject from '../../../utilities/deepCopyObject'
import { traverseFields } from './traverseFields'

type Args = {
  context: RequestContext
  currentDepth?: number
  depth: number
  doc: Record<string, unknown>
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  findMany?: boolean
  flattenLocales?: boolean
  overrideAccess: boolean
  req: PayloadRequest
  showHiddenFields: boolean
}

export async function afterRead<T = any>(args: Args): Promise<T> {
  const {
    context,
    currentDepth: incomingCurrentDepth,
    depth: incomingDepth,
    doc: incomingDoc,
    entityConfig,
    findMany,
    flattenLocales = true,
    overrideAccess,
    req,
    showHiddenFields,
  } = args

  const doc = deepCopyObject(incomingDoc)
  const fieldPromises = []
  const populationPromises = []

  let depth =
    incomingDepth || incomingDepth === 0
      ? parseInt(String(incomingDepth), 10)
      : req.payload.config.defaultDepth
  if (depth > req.payload.config.maxDepth) depth = req.payload.config.maxDepth

  const currentDepth = incomingCurrentDepth || 1

  traverseFields({
    context,
    currentDepth,
    depth,
    doc,
    fieldPromises,
    fields: entityConfig.fields,
    findMany,
    flattenLocales,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
    siblingDoc: doc,
  })

  await Promise.all(fieldPromises)
  await Promise.all(populationPromises)

  return doc
}
