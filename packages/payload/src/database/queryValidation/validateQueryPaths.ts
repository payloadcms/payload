/* eslint-disable no-restricted-syntax */
import type { SanitizedCollectionConfig } from '../../collections/config/types'
import type { Field, FieldAffectingData } from '../../fields/config/types'
import type { SanitizedGlobalConfig } from '../../globals/config/types'
/* eslint-disable no-await-in-loop */
import type { Operator, PayloadRequest, Where, WhereField } from '../../types'
import type { EntityPolicies } from './types'

import QueryError from '../../errors/QueryError'
import { validOperators } from '../../types/constants'
import { deepCopyObject } from '../../utilities/deepCopyObject'
import flattenFields from '../../utilities/flattenTopLevelFields'
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

const flattenWhere = (query: Where, sanitizePath: (path: string) => string): WhereField[] =>
  Object.entries(query).reduce((flattenedConstraints, [key, val]) => {
    if ((key === 'and' || key === 'or') && Array.isArray(val)) {
      const subWhereConstraints: Where[] = val.reduce((acc, subVal) => {
        const subWhere = flattenWhere(subVal, sanitizePath)
        return [...acc, ...subWhere]
      }, [])
      return [...flattenedConstraints, ...subWhereConstraints]
    }

    const sanitizedKey = sanitizePath(key)
    return [...flattenedConstraints, { [sanitizedKey]: val }]
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
  let fields = flattenFields((globalConfig || collectionConfig).fields) as FieldAffectingData[]

  if (versionFields) {
    const versionField = versionFields.find((field) => field.name === 'version')
    if (versionField && versionField.type === 'group' && versionField.fields) {
      fields = flattenFields(versionField.fields) as FieldAffectingData[]
    }
  }

  const sanitizePath = (path: string): string => {
    if (path.startsWith('version.')) {
      return path.replace(/^version\./, '')
    }
    return path
  }

  if (typeof where === 'object') {
    const whereFields = flattenWhere(where, sanitizePath)
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
