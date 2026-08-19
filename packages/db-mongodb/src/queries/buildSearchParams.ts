import type { QueryFilter } from 'mongoose'
import type {
  FlattenedField,
  HasManyRelationshipOperator,
  Operator,
  PathToQuery,
  Payload,
  Where,
} from 'payload'

import { Types } from 'mongoose'
import { APIError, escapeRegExp, getFieldByPath, getLocalizedPaths } from 'payload'
import { hasManyRelationshipOperatorSet, validOperatorSet } from 'payload/shared'

import type { MongooseAdapter } from '../index.js'
import type { OperatorMapKey } from './operatorMap.js'

import { getCollection } from '../utilities/getEntity.js'
import { isObjectID } from '../utilities/isObjectID.js'
import { operatorMap } from './operatorMap.js'
import { sanitizeQueryValue } from './sanitizeQueryValue.js'

type SearchParam = {
  path?: string
  rawQuery?: unknown
  value?: unknown
}

const subQueryOptions = {
  lean: true,
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
  operator: Operator
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

  if (
    hasManyRelationshipOperatorSet.has(operator as HasManyRelationshipOperator) &&
    paths.length === 1 &&
    (field.type === 'relationship' || field.type === 'upload') &&
    field.hasMany &&
    typeof field.relationTo === 'string' &&
    val !== null &&
    typeof val === 'object' &&
    !Array.isArray(val)
  ) {
    return buildHasManyRelationshipSearchParam({
      field,
      locale,
      nestedWhere: val,
      operator: operator as HasManyRelationshipOperator,
      path,
      payload,
    })
  }

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

    if (rawQuery && paths.length === 1) {
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
      const parentPaths = paths.slice(0, -1).reverse()

      let relationshipQuery: SearchParam = {
        value: {},
      }

      for (const [i, { collectionSlug, path: subPath }] of pathsToQuery.entries()) {
        // The arrays are reversed together, so both entries describe the same relationship hop.
        const parentField = parentPaths[i]?.field

        if (!parentField) {
          return undefined
        }

        if (!collectionSlug) {
          throw new APIError(`Collection with the slug ${collectionSlug} was not found.`)
        }

        const { collectionConfig, Model: SubModel } = getCollection({
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

          const select: Record<string, boolean> = {
            _id: true,
          }

          let joinPath: null | string = null

          if (parentField.type === 'join') {
            const relationshipField = getFieldByPath({
              fields: collectionConfig.flattenedFields,
              path: parentField.on,
            })
            if (!relationshipField) {
              throw new APIError('Relationship field was not found')
            }

            let path = relationshipField.localizedPath
            if (relationshipField.pathHasLocalized && payload.config.localization) {
              path = path.replace('<locale>', locale || payload.config.localization.defaultLocale)
            }
            select[path] = true

            joinPath = path
          }

          if (joinPath) {
            select[joinPath] = true
          }

          const result = await SubModel.find(subQuery).lean().select(select)

          const $in: unknown[] = []

          result.forEach((doc: any) => {
            if (joinPath) {
              let ref = doc

              for (const segment of joinPath.split('.')) {
                if (Array.isArray(ref)) {
                  ref = ref
                    .map((item) => (typeof item === 'object' && item ? item[segment] : undefined))
                    .flat()
                    .filter((item) => item != null)
                } else if (typeof ref === 'object' && ref) {
                  ref = ref[segment]
                } else {
                  ref = undefined
                  break
                }
              }

              if (Array.isArray(ref)) {
                for (const item of ref) {
                  if (isObjectID(item)) {
                    $in.push(item)
                  }
                }
              } else if (isObjectID(ref)) {
                $in.push(ref)
              }
            } else {
              const stringID = doc._id.toString()
              if (Types.ObjectId.isValid(stringID)) {
                $in.push(doc._id)
              } else {
                $in.push(stringID)
              }
            }
          })

          if (pathsToQuery.length === 1) {
            return {
              path: joinPath ? '_id' : path,
              value: { $in },
            }
          }

          const nextSubPath = pathsToQuery[i + 1]?.path

          if (nextSubPath) {
            relationshipQuery = {
              value: joinPath ? { _id: { $in } } : { [nextSubPath]: { $in } },
            }
          }

          continue
        }

        const subQuery = relationshipQuery.value as QueryFilter<any>

        /**
         * Follow this join back to its parent IDs.
         * For example, matching songs yield album IDs, then artist IDs.
         */
        if (parentField.type === 'join') {
          const relationshipField = getFieldByPath({
            fields: collectionConfig.flattenedFields,
            path: parentField.on,
          })
          if (!relationshipField) {
            throw new APIError('Relationship field was not found')
          }

          let joinPath = relationshipField.localizedPath
          if (relationshipField.pathHasLocalized && payload.config.localization) {
            joinPath = joinPath.replace(
              '<locale>',
              locale || payload.config.localization.defaultLocale,
            )
          }

          const $in = await SubModel.distinct(joinPath, subQuery)
          if (i + 1 === pathsToQuery.length) {
            return { path: '_id', value: { $in } }
          }

          relationshipQuery = { value: { _id: { $in } } }
          continue
        }

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
          const nextSubPath = pathsToQuery[i + 1]?.path
          if (nextSubPath) {
            relationshipQuery = {
              value: {
                [nextSubPath]: { $in },
              },
            }
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
                $regex: escapeRegExp(word),
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
                  $regex: escapeRegExp(word),
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

/**
 * Builds a MongoDB condition for an operator containing a nested has-many relationship query.
 *
 * First, it finds IDs from the related collection that match the nested query. The parent
 * collection can then use `$in` or `$nin` against its stored relationship IDs.
 *
 * @example
 * ```ts
 * // Input
 * { ingredients: { not_equals: { isHealthy: { equals: false } } } }
 *
 * // Simplified MongoDB result, after finding the matching ingredient IDs
 * { ingredients: { $nin: [unhealthyIngredientID] } }
 * ```
 */
async function buildHasManyRelationshipSearchParam({
  field,
  locale,
  nestedWhere,
  operator,
  path,
  payload,
}: {
  field: FlattenedField
  locale?: string
  nestedWhere: unknown
  operator: HasManyRelationshipOperator
  path: string
  payload: Payload
}): Promise<SearchParam | undefined> {
  if (
    (field.type !== 'relationship' && field.type !== 'upload') ||
    !field.hasMany ||
    typeof field.relationTo !== 'string' ||
    nestedWhere === null ||
    typeof nestedWhere !== 'object' ||
    Array.isArray(nestedWhere)
  ) {
    return undefined
  }

  const { Model: RelatedModel } = getCollection({
    adapter: payload.db as MongooseAdapter,
    collectionSlug: field.relationTo,
  })
  const pathLocale = payload.config.localization
    ? payload.config.localization.localeCodes.find(
        (localeCode) => path.split('.').at(-1) === localeCode,
      )
    : undefined
  const matchingRelatedDocumentsQuery = await RelatedModel.buildQuery({
    locale: pathLocale ?? locale,
    payload,
    where: nestedWhere as Where,
  })

  const findRelatedDocumentIDs = async (query: Record<string, unknown>) =>
    (await RelatedModel.find(query).lean().select({ _id: true })).map((document) => document._id)

  switch (operator) {
    case 'contains': {
      const matchingRelatedDocumentIDs = await findRelatedDocumentIDs(matchingRelatedDocumentsQuery)

      return {
        path,
        value: { $in: matchingRelatedDocumentIDs },
      }
    }

    case 'equals': {
      // Every related document satisfies an empty nested query.
      if (!Object.keys(matchingRelatedDocumentsQuery).length) {
        return {
          path,
          value: { $nin: [] },
        }
      }

      // MongoDB rejects `$near` and `$text` when they are inverted with `$nor`. Check the parent
      // instead: none of its IDs may fall outside the matching IDs.
      const matchingRelatedDocumentIDs = await findRelatedDocumentIDs(matchingRelatedDocumentsQuery)

      return {
        path,
        value: { $not: { $elemMatch: { $nin: matchingRelatedDocumentIDs } } },
      }
    }

    case 'not_equals': {
      const matchingRelatedDocumentIDs = await findRelatedDocumentIDs(matchingRelatedDocumentsQuery)

      return {
        path,
        value: { $nin: matchingRelatedDocumentIDs },
      }
    }
  }
}
