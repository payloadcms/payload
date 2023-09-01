/* eslint-disable no-restricted-syntax */
import type { SanitizedCollectionConfig } from '../../collections/config/types'
import type { Field, FieldAffectingData } from '../../fields/config/types'
import type { SanitizedGlobalConfig } from '../../globals/config/types'
/* eslint-disable no-await-in-loop */
import type { Operator, PayloadRequest, Where } from '../../types'
import type { EntityPolicies } from './types'

import QueryError from '../../errors/QueryError'
import { validOperators } from '../../types/constants'
import deepCopyObject from '../../utilities/deepCopyObject'
import flattenFields from '../../utilities/flattenTopLevelFields'
import flattenWhereToOperators from '../flattenWhereToOperators'
import { validateSearchParam } from './validateSearchParams'

type Args = {
  errors?: { path: string }[]
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
  const fields = flattenFields(
    versionFields || (globalConfig || collectionConfig).fields,
  ) as FieldAffectingData[]
  if (typeof where === 'object') {
    // const flattenedWhere = flattenWhere(where);
    const whereFields = flattenWhereToOperators(where)
    // We need to determine if the whereKey is an AND, OR, or a schema path
    const promises = []
    whereFields.map(async (constraint) => {
      Object.keys(constraint).map(async (path) => {
        Object.entries(constraint[path]).map(async ([operator, val]) => {
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
