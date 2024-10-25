import type { PipelineStage } from 'mongoose'
import type { Field, Operator, PathToQuery, Payload } from 'payload'

import ObjectIdImport from 'bson-objectid'
import mongoose from 'mongoose'
import { getLocalizedPaths } from 'payload'
import { validOperators } from 'payload/shared'

import { operatorMap } from './operatorMap.js'
import { sanitizeQueryValue } from './sanitizeQueryValue.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

type SearchParam = {
  path?: string
  rawQuery?: unknown
  value?: unknown
}

/**
 * Convert the Payload key / value / operator into a MongoDB query
 */
export function buildSearchParam({
  collectionSlug,
  fields,
  globalSlug,
  incomingPath,
  locale,
  operator,
  payload,
  pipeline,
  projection,
  val,
}: {
  collectionSlug?: string
  fields: Field[]
  globalSlug?: string
  incomingPath: string
  locale?: string
  operator: string
  payload: Payload
  pipeline: PipelineStage[]
  projection?: Record<string, boolean>
  val: unknown
}): SearchParam {
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
      } as Field,
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

  // eslint-disable-next-line prefer-const
  let [{ field, path }] = paths

  if (path) {
    let {
      // eslint-disable-next-line prefer-const
      operator: formattedOperator,
      // eslint-disable-next-line prefer-const
      rawQuery,
      val: formattedValue,
    } = sanitizeQueryValue({
      field,
      hasCustomID,
      operator,
      path,
      val,
    })

    if (rawQuery) {
      return { value: rawQuery }
    }

    // If there are multiple collections to search through,
    // Recursively build up a list of query constraints
    if (paths.length > 1) {
      let isID = false
      // Remove top collection and reverse array
      // to work backwards from top
      // const pathsToQuery = paths.slice(1).reverse()

      let currentPath: string

      for (let i = 0; i < paths.length; i++) {
        const pathToQuery = paths[i]

        if (!currentPath) {
          currentPath = pathToQuery.path
        }

        if (i + 1 === paths.length - 1 && paths[i + 1].path === 'id') {
          isID = true
          break
        }

        if (i === 0) {
          continue
        }

        pipeline.push({
          $lookup: {
            as: `_${currentPath}`,
            foreignField: '_id',
            from: pathToQuery.collectionSlug.endsWith('s')
              ? pathToQuery.collectionSlug
              : `${pathToQuery.collectionSlug}s`,
            localField: i === 1 ? currentPath : `_${currentPath}`,
          },
        })

        if (i === 1 && typeof projection === 'object') {
          projection[`_${currentPath}`] = false
        }

        if (!currentPath) {
          currentPath = pathToQuery.path
        } else {
          currentPath = `${currentPath}.${pathToQuery.path}`
        }
      }

      if (paths.length === 2 && paths[1].path === 'id') {
        path = paths[0].path
      } else {
        path = `_${paths
          .map((pathToQuery, i) => {
            if (i + 1 === paths.length - 1 && paths[i + 1].path === 'id') {
              return
            }
            return pathToQuery.path
          })
          .filter(Boolean)
          .join('.')}`
      }

      if (isID && typeof formattedValue === 'string') {
        formattedValue = new ObjectId(formattedValue)
      }
    }

    if (formattedOperator && validOperators.includes(formattedOperator as Operator)) {
      const operatorKey = operatorMap[formattedOperator]

      if (paths.length < 2 && (field.type === 'relationship' || field.type === 'upload')) {
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
          if (mongoose.Types.ObjectId.isValid(formattedValue)) {
            result.value[multiIDCondition].push({
              [path]: { [operatorKey]: ObjectId(formattedValue) },
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
