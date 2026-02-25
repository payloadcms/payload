import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { FlattenedField } from '../../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { Operator, PayloadRequest, Where, WhereField } from '../../types/index.js'
import type { EntityPolicies } from './types.js'

import { QueryError } from '../../errors/QueryError.js'
import { validOperatorSet } from '../../types/constants.js'
import { validateSearchParam } from './validateSearchParams.js'

type Args = {
  errors?: { path: string }[]
  overrideAccess: boolean
  // TODO: Rename to permissions or entityPermissions in 4.0
  policies?: EntityPolicies
  polymorphicJoin?: boolean
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
  polymorphicJoin,
  req,
  versionFields,
  where,
}: Args): Promise<void> {
  const fields = versionFields || (globalConfig || collectionConfig).flattenedFields

  if (typeof where === 'object') {
    // We need to determine if the whereKey is an AND, OR, or a schema path
    const promises: Promise<void>[] = []
    for (const path in where) {
      const constraint = where[path]

      if ((path === 'and' || path === 'or') && Array.isArray(constraint)) {
        for (const item of constraint) {
          if (collectionConfig) {
            promises.push(
              validateQueryPaths({
                collectionConfig,
                errors,
                overrideAccess,
                policies,
                polymorphicJoin,
                req,
                versionFields,
                where: item,
              }),
            )
          } else {
            promises.push(
              validateQueryPaths({
                errors,
                globalConfig,
                overrideAccess,
                policies,
                polymorphicJoin,
                req,
                versionFields,
                where: item,
              }),
            )
          }
        }
      } else if (!Array.isArray(constraint)) {
        for (const operator in constraint) {
          const val = constraint[operator as keyof typeof constraint]
          if (validOperatorSet.has(operator as Operator)) {
            promises.push(
              validateSearchParam({
                collectionConfig,
                constraint: where as WhereField,
                errors,
                fields,
                globalConfig,
                operator,
                overrideAccess,
                path,
                policies,
                polymorphicJoin,
                req,
                val,
                versionFields,
              }),
            )
          } else if (typeof val !== 'object' || val === null) {
            errors.push({ path: `${path}.${operator}` })
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
