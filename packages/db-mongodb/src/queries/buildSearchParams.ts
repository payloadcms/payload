import type { Payload } from 'payload'
import type { PathToQuery } from 'payload/database'
import type { Field } from 'payload/types'
import type { Operator } from 'payload/types'

import objectID from 'bson-objectid'
import mongoose from 'mongoose'
import { getLocalizedPaths } from 'payload/database'
import { fieldAffectsData } from 'payload/types'
import { validOperators } from 'payload/types'

import type { MongooseAdapter } from '..'

import { operatorMap } from './operatorMap'
import { sanitizeQueryValue } from './sanitizeQueryValue'

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
  payload,
  val,
}: {
  collectionSlug?: string
  fields: Field[]
  globalSlug?: string
  incomingPath: string
  locale?: string
  operator: string
  payload: Payload
  val: unknown
}): Promise<SearchParam> {
  // Replace GraphQL nested field double underscore formatting
  let sanitizedPath = incomingPath.replace(/__/g, '.')
  if (sanitizedPath === 'id') sanitizedPath = '_id'

  let paths: PathToQuery[] = []

  let hasCustomID = false

  if (sanitizedPath === '_id') {
    const customIDfield = fields.find((field) => fieldAffectsData(field) && field.name === 'id')

    let idFieldType: 'number' | 'text' = 'text'

    if (customIDfield) {
      if (customIDfield?.type === 'text' || customIDfield?.type === 'number') {
        idFieldType = customIDfield.type
      }

      hasCustomID = true
    }

    paths.push({
      collectionSlug,
      complete: true,
      field: {
        name: 'id',
        type: idFieldType,
      } as Field,
      path: '_id',
    })
  } else {
    paths = await getLocalizedPaths({
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
    const {
      operator: formattedOperator,
      rawQuery,
      val: formattedValue,
    } = sanitizeQueryValue({
      field,
      hasCustomID,
      operator,
      path,
      val,
    })

    if (rawQuery) return { value: rawQuery }

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

            const result = await SubModel.find(subQuery, subQueryOptions)

            const $in: unknown[] = []

            result.forEach((doc) => {
              const stringID = doc._id.toString()
              $in.push(stringID)

              if (mongoose.Types.ObjectId.isValid(stringID)) {
                $in.push(doc._id)
              }
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
          const result = await SubModel.find(subQuery, subQueryOptions)

          const $in = result.map((doc) => doc._id.toString())

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

        const result = {
          value: {
            $or: [{ [path]: { [operatorKey]: formattedValue } }],
          },
        }

        if (typeof formattedValue === 'string') {
          if (mongoose.Types.ObjectId.isValid(formattedValue)) {
            result.value.$or.push({ [path]: { [operatorKey]: objectID(formattedValue) } })
          } else {
            ;(Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo]).forEach(
              (relationTo) => {
                const isRelatedToCustomNumberID = payload.collections[
                  relationTo
                ]?.config?.fields.find((relatedField) => {
                  return (
                    fieldAffectsData(relatedField) &&
                    relatedField.name === 'id' &&
                    relatedField.type === 'number'
                  )
                })

                if (isRelatedToCustomNumberID) {
                  if (isRelatedToCustomNumberID.type === 'number') hasNumberIDRelation = true
                }
              },
            )

            if (hasNumberIDRelation)
              result.value.$or.push({ [path]: { [operatorKey]: parseFloat(formattedValue) } })
          }
        }

        if (result.value.$or.length > 1) {
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
