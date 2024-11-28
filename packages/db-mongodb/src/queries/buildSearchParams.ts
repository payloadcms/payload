import type { ClientSession, FindOptions } from 'mongodb'
import type { FlattenedField, Operator, PathToQuery, Payload } from 'payload'

import { Types } from 'mongoose'
import { getLocalizedPaths } from 'payload'
import { validOperators } from 'payload/shared'

import type { MongooseAdapter } from '../index.js'

import { operatorMap } from './operatorMap.js'
import { sanitizeQueryValue } from './sanitizeQueryValue.js'

type SearchParam = {
  path?: string
  rawQuery?: unknown
  value?: unknown
}

const subQueryOptions: FindOptions = {
  limit: 50,
  projection: {
    _id: true,
  },
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
  payload,
  session,
  val,
}: {
  collectionSlug?: string
  fields: FlattenedField[]
  globalSlug?: string
  incomingPath: string
  locale?: string
  operator: string
  payload: Payload
  session?: ClientSession
  val: unknown
}): Promise<SearchParam> {
  // Replace GraphQL nested field double underscore formatting
  let sanitizedPath = incomingPath.replace(/__/g, '.')
  if (sanitizedPath === 'id') {
    sanitizedPath = '_id'
  }

  let paths: PathToQuery[] = []

  let hasCustomID = false

  if (sanitizedPath === '_id') {
    const customIDFieldType = payload.collections[collectionSlug]?.customIDType

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
      path: '_id',
    })
  } else {
    paths = getLocalizedPaths({
      collectionSlug,
      fields,
      globalSlug,
      incomingPath: sanitizedPath,
      locale,
      payload,
    })
  }

  const [{ field, path }] = paths
  if (path) {
    const sanitizedQueryValue = sanitizeQueryValue({
      field,
      hasCustomID,
      operator,
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

    // If there are multiple collections to search through,
    // Recursively build up a list of query constraints
    if (paths.length > 1) {
      // Remove top collection and reverse array
      // to work backwards from top
      const pathsToQuery = paths.slice(1).reverse()

      const initialRelationshipQuery = {
        value: {},
      } as SearchParam

      const relationshipQuery = await pathsToQuery.reduce(
        async (priorQuery, { collectionSlug: slug, path: subPath }, i) => {
          const priorQueryResult = await priorQuery

          const SubModel = (payload.db as MongooseAdapter).collections[slug]

          // On the "deepest" collection,
          // Search on the value passed through the query
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

            const result = await SubModel.collection
              .find(subQuery, { session, ...subQueryOptions })
              .toArray()

            const $in: unknown[] = []

            result.forEach((doc) => {
              $in.push(doc._id)
            })

            if (pathsToQuery.length === 1) {
              return {
                path,
                value: { $in },
              }
            }

            const nextSubPath = pathsToQuery[i + 1].path

            return {
              value: { [nextSubPath]: { $in } },
            }
          }

          const subQuery = priorQueryResult.value
          const result = await SubModel.collection
            .find(subQuery, { session, ...subQueryOptions })
            .toArray()

          const $in = result.map((doc) => doc._id)

          // If it is the last recursion
          // then pass through the search param
          if (i + 1 === pathsToQuery.length) {
            return {
              path,
              value: { $in },
            }
          }

          return {
            value: {
              _id: { $in },
            },
          }
        },
        Promise.resolve(initialRelationshipQuery),
      )

      return relationshipQuery
    }

    if (formattedOperator && validOperators.includes(formattedOperator as Operator)) {
      const operatorKey = operatorMap[formattedOperator]

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
            result.value[multiIDCondition].push({
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
              result.value[multiIDCondition].push({
                [path]: { [operatorKey]: parseFloat(formattedValue) },
              })
            }
          }
        }

        if (result.value[multiIDCondition].length > 1) {
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
