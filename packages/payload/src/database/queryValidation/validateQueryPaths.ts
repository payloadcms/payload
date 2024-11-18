import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { FlattenField } from '../../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { Operator, PayloadRequest, Where, WhereField } from '../../types/index.js'
import type { EntityPolicies } from './types.js'

import { QueryError } from '../../errors/QueryError.js'
import { validOperators } from '../../types/constants.js'
import { deepCopyObject } from '../../utilities/deepCopyObject.js'
import { validateSearchParam } from './validateSearchParams.js'

type Args = {
  errors?: { path: string }[]
  overrideAccess: boolean
  policies?: EntityPolicies
  req: PayloadRequest
  versionFields?: FlattenField[]
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
  const fields = versionFields || (globalConfig || collectionConfig).flattenFields

  if (typeof where === 'object') {
    const whereFields = flattenWhere(where)
    // We need to determine if the whereKey is an AND, OR, or a schema path
    const promises = []
    void whereFields.map((constraint) => {
      void Object.keys(constraint).map((path) => {
        void Object.entries(constraint[path]).map(([operator, val]) => {
          if (validOperators.includes(operator as Operator)) {
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
        })
      })
    })
    await Promise.all(promises)
    if (errors.length > 0) {
      throw new QueryError(errors)
    }
  }
}
