import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { FlattenedField } from '../../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { Operator, PayloadRequest, Where, WhereField } from '../../types/index.js'
import type { EntityPolicies } from './types.js'

import { QueryError } from '../../errors/QueryError.js'
import { validOperatorSet } from '../../types/constants.js'
import { validateSearchParam } from './validateSearchParams.js'

type Args = {
  blockSlug?: string
  errors?: { path: string }[]
  overrideAccess: boolean
  // TODO: Rename to permissions or entityPermissions in 4.0
  policies?: EntityPolicies
  polymorphicJoinCollections?: string[]
  req: PayloadRequest
  showHiddenFields?: boolean
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
  blockSlug,
  collectionConfig,
  errors = [],
  globalConfig,
  overrideAccess,
  policies = {
    collections: {},
    globals: {},
  },
  polymorphicJoinCollections,
  req,
  showHiddenFields,
  versionFields,
  where,
}: Args): Promise<void> {
  const fields = versionFields || (globalConfig || collectionConfig).flattenedFields

  if (typeof where === 'object') {
    // We need to determine if the whereKey is an AND, OR, or a schema path
    const promises: Promise<void>[] = []
    for (const path in where) {
      const constraint = where[path]

      if (['and', 'or'].includes(path.toLowerCase()) && Array.isArray(constraint)) {
        for (const item of constraint) {
          if (collectionConfig) {
            promises.push(
              validateQueryPaths({
                blockSlug,
                collectionConfig,
                errors,
                overrideAccess,
                policies,
                polymorphicJoinCollections,
                req,
                showHiddenFields,
                versionFields,
                where: item,
              }),
            )
          } else {
            promises.push(
              validateQueryPaths({
                blockSlug,
                errors,
                globalConfig,
                overrideAccess,
                policies,
                polymorphicJoinCollections,
                req,
                showHiddenFields,
                versionFields,
                where: item,
              }),
            )
          }
        }
      } else if (Array.isArray(constraint)) {
        errors.push({ path })
      } else if (!Array.isArray(constraint)) {
        for (const operator in constraint) {
          const val = constraint[operator as keyof typeof constraint]
          if (validOperatorSet.has(operator as Operator)) {
            promises.push(
              validateSearchParam({
                blockSlug,
                collectionConfig,
                constraint: where as WhereField,
                errors,
                fields,
                globalConfig,
                operator,
                overrideAccess,
                path,
                policies,
                polymorphicJoinCollections,
                req,
                showHiddenFields,
                val,
                versionFields,
              }),
            )
          } else {
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
