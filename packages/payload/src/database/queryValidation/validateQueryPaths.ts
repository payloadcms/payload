import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Field, FieldAffectingData } from '../../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { JoinQuery, Operator, PayloadRequest, Where, WhereField } from '../../types/index.js'
import type { EntityPolicies } from './types.js'

import { QueryError } from '../../errors/QueryError.js'
import { validOperators } from '../../types/constants.js'
import { deepCopyObject } from '../../utilities/deepCopyObject.js'
import flattenFields from '../../utilities/flattenTopLevelFields.js'
import { validateSearchParam } from './validateSearchParams.js'

type Args = {
  errors?: { path: string }[]
  joins?: JoinQuery
  overrideAccess: boolean
  policies?: EntityPolicies
  req: PayloadRequest
  versionFields?: Field[]
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

const flattenWhere = (query: Where): WhereField[] =>
  Object.entries(query).reduce((flattenedConstraints, [key, val]) => {
    if ((key === 'and' || key === 'or') && Array.isArray(val)) {
      const subWhereConstraints: Where[] = val.reduce((acc, subVal) => {
        const subWhere = flattenWhere(subVal)
        return [...acc, ...subWhere]
      }, [])
      return [...flattenedConstraints, ...subWhereConstraints]
    }

    return [...flattenedConstraints, { [key]: val }]
  }, [])

/**
 * Iterates over the `where` object and to validate the field paths are correct and that the user has access to the fields
 */
export async function validateQueryPaths({
  collectionConfig,
  errors = [],
  globalConfig,
  joins,
  overrideAccess,
  policies = {
    collections: {},
    globals: {},
  },
  req,
  versionFields,
  where: whereArg,
}: Args): Promise<void> {
  let where = whereArg
  const fields = flattenFields(
    versionFields || (globalConfig || collectionConfig).fields,
  ) as FieldAffectingData[]
  const promises = []

  // Validate the user has access to configured join fields
  if (collectionConfig.joins) {
    Object.entries(collectionConfig.joins).forEach(([collectionSlug, collectionJoins]) => {
      collectionJoins.forEach((join) => {
        if (join.field.where) {
          promises.push(
            validateQueryPaths({
              collectionConfig: req.payload.config.collections.find(
                (config) => config.slug === collectionSlug,
              ),
              errors,
              overrideAccess,
              policies,
              req,
              where: join.field.where,
            }),
          )
        }
      })
    })
  }

  if (joins) {
    where = { ...whereArg }
    // concat schemaPath of joins to the join.where to be passed for validation
    Object.entries(joins).forEach(([schemaPath, { where: whereJoin }]) => {
      if (whereJoin) {
        Object.entries(whereJoin).forEach(([path, constraint]) => {
          // merge the paths together to be handled the same way as relationships
          where[`${schemaPath}.${path}`] = constraint
        })
      }
    })
  }

  if (typeof where === 'object') {
    const whereFields = flattenWhere(where)
    // We need to determine if the whereKey is an AND, OR, or a schema path
    void whereFields.map((constraint) => {
      void Object.keys(constraint).map((path) => {
        void Object.entries(constraint[path]).map(([operator, val]) => {
          if (validOperators.includes(operator as Operator)) {
            promises.push(
              validateSearchParam({
                collectionConfig: deepCopyObject(collectionConfig),
                errors,
                fields: fields as Field[],
                globalConfig: deepCopyObject(globalConfig),
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
        })
      })
    })

    await Promise.all(promises)
    if (errors.length > 0) {
      throw new QueryError(errors)
    }
  }
}
