import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { FlattenedField } from '../../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { PayloadRequest, Sort, Where } from '../../types/index.js'

import { getLocalizedPaths } from '../getLocalizedPaths.js'
import { validateQueryPaths } from './validateQueryPaths.js'

type Args = {
  overrideAccess: boolean
  req: PayloadRequest
  sort?: Sort
  versionFields?: FlattenedField[]
} & (
  | {
      collectionConfig: SanitizedCollectionConfig
      globalConfig?: undefined
    }
  | {
      collectionConfig?: undefined
      globalConfig: SanitizedGlobalConfig
    }
)

/**
 * Ensures sort paths are subject to the same field-read access checks as query `where` paths,
 * since database sorting happens before response-time field redaction.
 */
export const validateSortQuery = async ({
  collectionConfig,
  globalConfig,
  overrideAccess,
  req,
  sort,
  versionFields,
}: Args): Promise<void> => {
  if (overrideAccess || !sort) {
    return
  }

  const fields = versionFields || (globalConfig || collectionConfig).flattenedFields
  const sortFields = Array.isArray(sort) ? sort : [sort]
  const where: Where = {}

  for (const sortField of sortFields) {
    const path = sortField.replace(/^-/, '').replace(/__/g, '.')
    const paths = getLocalizedPaths({
      collectionSlug: collectionConfig?.slug,
      fields,
      globalSlug: globalConfig?.slug,
      incomingPath: path,
      locale: req.locale!,
      overrideAccess: true,
      parentIsLocalized: false,
      payload: req.payload,
    })

    if (path !== 'id' && path !== '_id' && paths.every(({ invalid }) => !invalid)) {
      where[path] = { exists: true }
    }
  }

  if (Object.keys(where).length === 0) {
    return
  }

  if (collectionConfig) {
    await validateQueryPaths({
      collectionConfig,
      overrideAccess,
      req,
      versionFields,
      where,
    })
  } else {
    await validateQueryPaths({
      globalConfig,
      overrideAccess,
      req,
      versionFields,
      where,
    })
  }
}
