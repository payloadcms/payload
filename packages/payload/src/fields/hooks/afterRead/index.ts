import type { SanitizedCollectionConfig } from '../../../collections/config/types'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { SanitizedGlobalConfig } from '../../../globals/config/types'

import { deepCopyObject } from '../../../utilities/deepCopyObject'
import { traverseFields } from './traverseFields'

type Args = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  currentDepth?: number
  depth: number
  doc: Record<string, unknown>
  draft: boolean
  fallbackLocale: null | string
  findMany?: boolean
  flattenLocales?: boolean
  global: SanitizedGlobalConfig | null
  locale: string
  overrideAccess: boolean
  req: PayloadRequest
  showHiddenFields: boolean
}

export async function afterRead<T = any>(args: Args): Promise<T> {
  const {
    collection,
    context,
    currentDepth: incomingCurrentDepth,
    depth: incomingDepth,
    doc: incomingDoc,
    draft,
    fallbackLocale,
    findMany,
    flattenLocales = true,
    global,
    locale,
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
    collection,
    context,
    currentDepth,
    depth,
    doc,
    draft,
    fallbackLocale,
    fieldPromises,
    fields: collection?.fields || global?.fields,
    findMany,
    flattenLocales,
    global,
    locale,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
    siblingDoc: doc,
  })

  while (fieldPromises.length > 0 || populationPromises.length > 0) {
    const allPromises = [...fieldPromises, ...populationPromises]
    fieldPromises.splice(0)
    populationPromises.splice(0)
    await Promise.all(allPromises)
  }

  return doc
}
