import type { QueryFilter } from 'mongoose'
import type { FlattenedField, Operator, Payload, Where } from 'payload'

import { deepMergeWithCombinedArrays } from 'payload'
import { validOperatorSet } from 'payload/shared'

import { buildAndOrConditions } from './buildAndOrConditions.js'
import { buildSearchParam } from './buildSearchParams.js'

export async function parseParams({
  collectionSlug,
  fields,
  globalSlug,
  locale,
  parentIsLocalized,
  payload,
  where,
}: {
  collectionSlug?: string
  fields: FlattenedField[]
  globalSlug?: string
  locale?: string
  parentIsLocalized: boolean
  payload: Payload
  where: Where
}): Promise<Record<string, unknown>> {
  let result = {} as QueryFilter<any>

  if (typeof where === 'object') {
    // We need to determine if the whereKey is an AND, OR, or a schema path
    for (const relationOrPath of Object.keys(where)) {
      const condition = where[relationOrPath]
      let conditionOperator: '$and' | '$or' | null = null
      if (relationOrPath.toLowerCase() === 'and') {
        conditionOperator = '$and'
      } else if (relationOrPath.toLowerCase() === 'or') {
        conditionOperator = '$or'
      }
      if (Array.isArray(condition)) {
        const builtConditions = await buildAndOrConditions({
          collectionSlug,
          fields,
          globalSlug,
          locale,
          parentIsLocalized,
          payload,
          where: condition,
        })
        if (builtConditions.length > 0 && conditionOperator !== null) {
          addLogicalConditions({ conditions: builtConditions, operator: conditionOperator, result })
        }
      } else {
        // It's a path - and there can be multiple comparisons on a single path.
        // For example - title like 'test' and title not equal to 'tester'
        // So we need to loop on keys again here to handle each operator independently
        const pathOperators = where[relationOrPath]
        if (typeof pathOperators === 'object') {
          const validOperators: Operator[] = Object.keys(pathOperators).filter((operator) =>
            validOperatorSet.has(operator as Operator),
          ) as Operator[]

          for (const operator of validOperators) {
            const searchParam = await buildSearchParam({
              collectionSlug,
              fields,
              globalSlug,
              incomingPath: relationOrPath,
              locale,
              operator,
              parentIsLocalized,
              payload,
              val: (pathOperators as Record<string, Where>)[operator],
            })

            if (searchParam?.value && searchParam?.path) {
              if (validOperators.length > 1) {
                if (!result.$and) {
                  result.$and = []
                }
                result.$and.push({
                  [searchParam.path]: searchParam.value,
                })
              } else {
                if (result[searchParam.path]) {
                  if (!result.$and) {
                    result.$and = []
                  }

                  result.$and.push({ [searchParam.path]: result[searchParam.path] })
                  result.$and.push({
                    [searchParam.path]: searchParam.value,
                  })
                  delete result[searchParam.path]
                } else {
                  result[searchParam.path] = searchParam.value
                }
              }
            } else if (typeof searchParam?.value === 'object') {
              const { $and, $or, ...rawQuery } = (searchParam.value ?? {}) as Record<
                string,
                unknown
              >
              if (Array.isArray($and)) {
                addLogicalConditions({ conditions: $and, operator: '$and', result })
              }
              if (Array.isArray($or)) {
                addLogicalConditions({ conditions: $or, operator: '$or', result })
              }
              result = deepMergeWithCombinedArrays(result, rawQuery, {
                // dont clone Types.ObjectIDs
                clone: false,
              })
            }
          }
        }
      }
    }
  }

  return result
}

/**
 * Adds `$and` / `$or` conditions without dropping the ones earlier keys of the same `where` built:
 * `$and` conditions accumulate, and a second `$or` group is ANDed with the first one.
 */
function addLogicalConditions({
  conditions,
  operator,
  result,
}: {
  conditions: unknown[]
  operator: '$and' | '$or'
  result: { $and?: unknown[]; $or?: unknown[] }
}): void {
  if (operator === '$and') {
    result.$and = [...(result.$and ?? []), ...conditions]
  } else if (!result.$or) {
    result.$or = conditions
  } else {
    result.$and = [...(result.$and ?? []), { $or: conditions }]
  }
}
