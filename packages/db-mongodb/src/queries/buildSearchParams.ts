import type { FilterQuery } from 'mongoose'
import type { FlattenedField, Operator, PathToQuery, Payload } from 'payload'

import { Types } from 'mongoose'
import { APIError, getLocalizedPaths } from 'payload'
import { validOperatorSet } from 'payload/shared'

import type { MongooseAdapter } from '../index.js'
import type { OperatorMapKey } from './operatorMap.js'

import { getCollection } from '../utilities/getEntity.js'
import { operatorMap } from './operatorMap.js'
import { sanitizeQueryValue } from './sanitizeQueryValue.js'

type SearchParam = {
  path?: string
  rawQuery?: unknown
  value?: unknown
}

const subQueryOptions = {
  lean: true,
  limit: 50,
}

/**
 * Convert the Payload key / value / operator into a MongoDB query
 */
export async function buildSearchParam({
  collectionSlug,
  fields,
  globalSlug,
  incomingPath,
  locale,
  operator,
  parentIsLocalized,
  payload,
  val,
}: {
  collectionSlug?: string
  fields: FlattenedField[]
  globalSlug?: string
  incomingPath: string
  locale?: string
  operator: string
  parentIsLocalized: boolean
  payload: Payload
  val: unknown
}): Promise<SearchParam | undefined> {
  // Replace GraphQL nested field double underscore formatting
  let sanitizedPath = incomingPath.replace(/__/g, '.')
  if (sanitizedPath === 'id') {
    sanitizedPath = '_id'
  }

  let paths: PathToQuery[] = []

  let hasCustomID = false

  if (sanitizedPath === '_id') {
    const customIDFieldType = collectionSlug
      ? payload.collections[collectionSlug]?.customIDType
      : undefined

    let idFieldType: 'number' | 'text' = 'text'

    if (customIDFieldType) {
      idFieldType = customIDFieldType
      hasCustomID = true
    }

    paths.push({
      collectionSlug,
      complete: true,
      field: {
        name: 'id',
        type: idFieldType,
      } as FlattenedField,
      parentIsLocalized: parentIsLocalized ?? false,
      path: '_id',
    })
  } else {
    paths = getLocalizedPaths({
      collectionSlug,
      fields,
      globalSlug,
      incomingPath: sanitizedPath,
      locale,
      parentIsLocalized,
      payload,
    })
  }

  if (!paths[0]) {
    return undefined
  }

  const [{ field, path }] = paths
  if (path) {
    const sanitizedQueryValue = sanitizeQueryValue({
      field,
      hasCustomID,
      locale,
      operator,
      parentIsLocalized,
      path,
      payload,
      val,
    })

    if (!sanitizedQueryValue) {
      return undefined
    }

    const { operator: formattedOperator, rawQuery, val: formattedValue } = sanitizedQueryValue

    if (rawQuery) {
      return { value: rawQuery }
    }

    if (!formattedOperator) {
      return undefined
    }

    // If there are multiple collections to search through,
    // Recursively build up a list of query constraints
    if (paths.length > 1) {
      // Remove top collection and reverse array
      // to work backwards from top
      const pathsToQuery = paths.slice(1).reverse()

      let relationshipQuery: SearchParam = {
        value: {},
      }

      for (const [i, { collectionSlug, path: subPath }] of pathsToQuery.entries()) {
        if (!collectionSlug) {
          throw new APIError(`Collection with the slug ${collectionSlug} was not found.`)
        }

        const { Model: SubModel } = getCollection({
          adapter: payload.db as MongooseAdapter,
          collectionSlug,
        })

        if (i === 0) {
          const subQuery = await SubModel.buildQuery({
            locale,
            payload,
            where: {
              [subPath]: {
                [formattedOperator]: val,
              },
            },
          })

          const result = await SubModel.find(subQuery, subQueryOptions)

          const $in: unknown[] = []

          result.forEach((doc) => {
            const stringID = doc._id.toString()
            $in.push(stringID)

            if (Types.ObjectId.isValid(stringID)) {
              $in.push(doc._id)
            }
          })

          if (pathsToQuery.length === 1) {
            return {
              path,
              value: { $in },
            }
          }

          const nextSubPath = pathsToQuery[i + 1]?.path

          if (nextSubPath) {
            relationshipQuery = { value: { [nextSubPath]: $in } }
          }

          continue
        }

        const subQuery = relationshipQuery.value as FilterQuery<any>
        const result = await SubModel.find(subQuery, subQueryOptions)

        const $in = result.map((doc) => doc._id)

        // If it is the last recursion
        // then pass through the search param
        if (i + 1 === pathsToQuery.length) {
          relationshipQuery = {
            path,
            value: { $in },
          }
        } else {
          relationshipQuery = {
            value: {
              _id: { $in },
            },
          }
        }
      }

      return relationshipQuery
    }

    if (formattedOperator && validOperatorSet.has(formattedOperator as Operator)) {
      const operatorKey = operatorMap[formattedOperator as OperatorMapKey]

      if (field.type === 'relationship' || field.type === 'upload') {
        let hasNumberIDRelation
        let multiIDCondition = '$or'
        if (operatorKey === '$ne') {
          multiIDCondition = '$and'
        }

        const result = {
          value: {
            [multiIDCondition]: [{ [path]: { [operatorKey]: formattedValue } }],
          },
        }

        if (typeof formattedValue === 'string') {
          if (Types.ObjectId.isValid(formattedValue)) {
            result.value[multiIDCondition]?.push({
              [path]: { [operatorKey]: new Types.ObjectId(formattedValue) },
            })
          } else {
            ;(Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo]).forEach(
              (relationTo) => {
                const isRelatedToCustomNumberID =
                  payload.collections[relationTo]?.customIDType === 'number'

                if (isRelatedToCustomNumberID) {
                  hasNumberIDRelation = true
                }
              },
            )

            if (hasNumberIDRelation) {
              result.value[multiIDCondition]?.push({
                [path]: { [operatorKey]: parseFloat(formattedValue) },
              })
            }
          }
        }

        const length = result.value[multiIDCondition]?.length

        if (typeof length === 'number' && length > 1) {
          return result
        }
      }

      if (formattedOperator === 'like' && typeof formattedValue === 'string') {
        const words = formattedValue.split(' ')

        const result = {
          value: {
            $and: words.map((word) => ({
              [path]: {
                $options: 'i',
                $regex: word.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&'),
              },
            })),
          },
        }

        return result
      }

      if (formattedOperator === 'not_like' && typeof formattedValue === 'string') {
        const words = formattedValue.split(' ')

        const result = {
          value: {
            $and: words.map((word) => ({
              [path]: {
                $not: {
                  $options: 'i',
                  $regex: word.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&'),
                },
              },
            })),
          },
        }

        return result
      }

      // Some operators like 'near' need to define a full query
      // so if there is no operator key, just return the value
      if (!operatorKey) {
        return {
          path,
          value: formattedValue,
        }
      }

      return {
        path,
        value: { [operatorKey]: formattedValue },
      }
    }
  }
  return undefined
}
