// @ts-strict-ignore
import type { SanitizedJoin, SanitizedJoins } from '../../collections/config/types.js'
import type { Config, SanitizedConfig } from '../../config/types.js'

import { APIError } from '../../errors/index.js'
import { InvalidFieldJoin } from '../../errors/InvalidFieldJoin.js'
import { traverseFields } from '../../utilities/traverseFields.js'
import {
  fieldShouldBeLocalized,
  type FlattenedJoinField,
  type JoinField,
  type RelationshipField,
  type UploadField,
} from './types.js'
export const sanitizeJoinField = ({
  config,
  field,
  joinPath,
  joins,
  parentIsLocalized,
  polymorphicJoins,
  validateOnly,
}: {
  config: Config
  field: FlattenedJoinField | JoinField
  joinPath?: string
  joins?: SanitizedJoins
  parentIsLocalized: boolean
  polymorphicJoins?: SanitizedJoin[]
  validateOnly?: boolean
}) => {
  // the `joins` arg is not passed for globals or when recursing on fields that do not allow a join field
  if (typeof joins === 'undefined') {
    throw new APIError('Join fields cannot be added to arrays, blocks or globals.')
  }
  if (typeof field.maxDepth === 'undefined') {
    field.maxDepth = 1
  }
  const join: SanitizedJoin = {
    field,
    joinPath: `${joinPath ? joinPath + '.' : ''}${field.name}`,
    parentIsLocalized,
    targetField: undefined,
  }

  if (Array.isArray(field.collection)) {
    for (const collection of field.collection) {
      const sanitizedField = {
        ...field,
        collection,
      } as FlattenedJoinField

      sanitizeJoinField({
        config,
        field: sanitizedField,
        joinPath,
        joins,
        parentIsLocalized,
        polymorphicJoins,
        validateOnly: true,
      })
    }

    if (Array.isArray(polymorphicJoins)) {
      polymorphicJoins.push(join)
    }

    return
  }

  const joinCollection = config.collections.find(
    (collection) => collection.slug === field.collection,
  )
  if (!joinCollection) {
    throw new InvalidFieldJoin(field)
  }
  let joinRelationship: RelationshipField | UploadField

  const pathSegments = field.on.split('.') // Split the schema path into segments
  let currentSegmentIndex = 0

  let localized = false
  // Traverse fields and match based on the schema path
  traverseFields({
    callback: ({ field, next, parentIsLocalized }) => {
      if (!('name' in field) || !field.name) {
        return
      }
      const currentSegment = pathSegments[currentSegmentIndex]
      // match field on path segments
      if ('name' in field && field.name === currentSegment) {
        if (fieldShouldBeLocalized({ field, parentIsLocalized })) {
          localized = true
          const fieldIndex = currentSegmentIndex

          join.getForeignPath = ({ locale }) => {
            return pathSegments.reduce((acc, segment, index) => {
              let result = `${acc}${segment}`

              if (index === fieldIndex) {
                result = `${result}.${locale}`
              }

              if (index !== pathSegments.length - 1) {
                result = `${result}.`
              }

              return result
            }, '')
          }
        }

        // Check if this is the last segment in the path
        if (
          (currentSegmentIndex === pathSegments.length - 1 &&
            'type' in field &&
            field.type === 'relationship') ||
          field.type === 'upload'
        ) {
          joinRelationship = field // Return the matched field
          next()
          return true
        } else {
          // Move to the next path segment and continue traversal
          currentSegmentIndex++
        }
      } else {
        // skip fields in non-matching path segments
        next()
        return
      }
    },
    config: config as unknown as SanitizedConfig,
    fields: joinCollection.fields,
    parentIsLocalized: false,
  })

  if (!joinRelationship) {
    throw new InvalidFieldJoin(join.field)
  }

  if (!joinRelationship.index && !joinRelationship.unique) {
    joinRelationship.index = true
  }

  if (validateOnly) {
    return
  }

  join.targetField = joinRelationship

  // override the join field localized property to use whatever the relationship field has
  // or if it's nested to a localized array / blocks / tabs / group
  field.localized = localized
  // override the join field hasMany property to use whatever the relationship field has
  field.hasMany = joinRelationship.hasMany

  // @ts-expect-error converting JoinField to FlattenedJoinField to track targetField
  field.targetField = join.targetField

  if (!joins[field.collection]) {
    joins[field.collection] = [join]
  } else {
    joins[field.collection].push(join)
  }
}
