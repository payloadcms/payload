import type { PipelineStage } from 'mongoose'
import type { FlattenedField, Operator, PathToQuery, Payload } from 'payload'

import { Types } from 'mongoose'
import { getLocalizedPaths } from 'payload'
import { validOperators } from 'payload/shared'

import { operatorMap } from './operatorMap.js'
import { sanitizeQueryValue } from './sanitizeQueryValue.js'

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
  fields: FlattenedField[]
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

  let path = paths[0].path
  const field = paths[0].field

  if (path) {
    let formattedOperator: string
    let rawQuery: unknown
    let formattedValue: unknown

    if (rawQuery) {
      return { value: rawQuery }
    }

    // If there are multiple collections to search through,
    // Build $lookup
    if (paths.length > 1) {
      let isID = false

      let currentPath = ''

      for (let i = 0; i < paths.length; i++) {
        const pathToQuery = paths[i]

        if (
          pathToQuery.field.type === 'relationship' &&
          typeof pathToQuery.field.relationTo === 'string' &&
          i !== paths.length - 1
        ) {
          if (paths[i + 1].path === 'id') {
            currentPath = `${currentPath}${pathToQuery.path}`
            isID = true
            const sanitizeResult = sanitizeQueryValue({
              field: pathToQuery.field,
              hasCustomID,
              operator,
              path: pathToQuery.path,
              payload,
              val,
            })

            if (sanitizeResult) {
              formattedOperator = sanitizeResult.operator
              formattedValue = sanitizeResult.val
              rawQuery = sanitizeResult.rawQuery
            }

            break
          }
          const as = `${currentPath}_${pathToQuery.path}`
          if (i === 0 && projection && !Object.values(projection).some((val) => val === true)) {
            projection[as] = false
          }

          if (!pipeline.some((pipeline: PipelineStage.Lookup) => pipeline?.$lookup?.as === as)) {
            pipeline.push({
              $lookup: {
                as: `${currentPath}_${pathToQuery.path}`,
                foreignField: '_id',
                from: payload.db.collections[pathToQuery.field.relationTo].collection.name,
                localField: `${currentPath}${pathToQuery.path}`,
              },
            })
          }
        }
        if (i === paths.length - 1) {
          currentPath += pathToQuery.path
          const sanitizeResult = sanitizeQueryValue({
            field: pathToQuery.field,
            hasCustomID,
            operator,
            path: pathToQuery.path,
            payload,
            val,
          })

          if (sanitizeResult) {
            formattedOperator = sanitizeResult.operator
            formattedValue = sanitizeResult.val
            rawQuery = sanitizeResult.rawQuery
          }
        } else {
          currentPath += `_${pathToQuery.path}.`
        }
      }

      path = currentPath

      if (isID && typeof formattedValue === 'string') {
        formattedValue = new Types.ObjectId(formattedValue)
      }
    } else {
      const sanitizeResult = sanitizeQueryValue({
        field,
        hasCustomID,
        operator,
        path,
        payload,
        val,
      })

      if (sanitizeResult) {
        formattedOperator = sanitizeResult.operator
        formattedValue = sanitizeResult.val
        rawQuery = sanitizeResult.rawQuery
      }
    }

    if (rawQuery) {
      return { value: rawQuery }
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
