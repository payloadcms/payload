import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { FlattenedField } from '../../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { Operator, PayloadRequest, Where } from '../../types/index.js'
import type { EntityPolicies } from './types.js'

import { QueryError } from '../../errors/QueryError.js'
import { validOperatorSet } from '../../types/constants.js'
import { flattenWhereToOperators } from '../flattenWhereToOperators.js'
import { validateSearchParam } from './validateSearchParams.js'

type Args = {
  errors?: { path: string }[]
  overrideAccess: boolean
  policies?: EntityPolicies
  req: PayloadRequest
  versionFields?: FlattenedField[]
  where: Where
} & (
  | {
      collectionConfig: SanitizedCollectionConfig
      globalConfig?: never | undefined
    }
  | {
      collectionConfig?: never | undefined
      globalConfig: SanitizedGlobalConfig
    }
)

export async function validateQueryPaths({
  collectionConfig,
  errors = [],
  globalConfig,
  overrideAccess,
  policies = {
    collections: {},
    globals: {},
  },
  req,
  versionFields,
  where,
}: Args): Promise<void> {
  const fields = versionFields || (globalConfig || collectionConfig).flattenedFields

  if (typeof where === 'object') {
    const whereFields = flattenWhereToOperators(where)
    // We need to determine if the whereKey is an AND, OR, or a schema path
    const promises = []
    for (const constraint of whereFields) {
      for (const path in constraint) {
        for (const operator in constraint[path]) {
          const val = constraint[path][operator]
          if (validOperatorSet.has(operator as Operator)) {
            promises.push(
              validateSearchParam({
                collectionConfig,
                errors,
                fields,
                globalConfig,
                operator,
                overrideAccess,
                path,
                policies,
                req,
                val,
                versionFields,
              }),
            )
          }
        }
      }
    }

    await Promise.all(promises)
    if (errors.length > 0) {
      throw new QueryError(errors)
    }
  }
}
