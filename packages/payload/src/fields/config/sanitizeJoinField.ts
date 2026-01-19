import type { SanitizedJoin, SanitizedJoins } from '../../collections/config/types.js'
import type { Config } from '../../config/types.js'
import type { FlattenedJoinField, JoinField } from './types.js'

import { APIError } from '../../errors/index.js'
import { InvalidFieldJoin } from '../../errors/InvalidFieldJoin.js'
import { flattenAllFields } from '../../utilities/flattenAllFields.js'
import { getFieldByPath } from '../../utilities/getFieldByPath.js'

export const sanitizeJoinField = ({
  config,
  field,
  joinPath,
  joins,
  parentIsLocalized,
  pathToField: incomingPathToField,
  polymorphicJoins,
  validateOnly,
}: {
  config: Config
  field: FlattenedJoinField | JoinField
  joinPath?: string
  joins?: SanitizedJoins
  parentIsLocalized: boolean
  pathToField: string[]
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
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
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
        pathToField: [...incomingPathToField, sanitizedField.name],
        polymorphicJoins,
        validateOnly: true,
      })
    }

    if (Array.isArray(polymorphicJoins)) {
      polymorphicJoins.push(join)
    }

    return
  }

  const pathToFieldString = incomingPathToField.join(' > ')

  const joinCollection = config.collections?.find(
    (collection) => collection.slug === field.collection,
  )
  if (!joinCollection) {
    throw new InvalidFieldJoin(field, pathToFieldString)
  }

  const relationshipField = getFieldByPath({
    fields: flattenAllFields({ cache: true, fields: joinCollection.fields }),
    path: field.on,
  })

  if (
    !relationshipField ||
    (relationshipField.field.type !== 'relationship' && relationshipField.field.type !== 'upload')
  ) {
    throw new InvalidFieldJoin(join.field, pathToFieldString)
  }

  if (relationshipField.pathHasLocalized) {
    join.getForeignPath = ({ locale }) => {
      return relationshipField.localizedPath.replace('<locale>', locale!)
    }
  }

  if (!relationshipField.field.index && !relationshipField.field.unique) {
    relationshipField.field.index = true
  }

  if (validateOnly) {
    return
  }

  join.targetField = relationshipField.field

  // override the join field localized property to use whatever the relationship field has
  // or if it's nested to a localized array / blocks / tabs / group
  field.localized = relationshipField.field.localized
  // override the join field hasMany property to use whatever the relationship field has
  field.hasMany = relationshipField.field.hasMany

  // @ts-expect-error converting JoinField to FlattenedJoinField to track targetField
  field.targetField = join.targetField

  if (!joins[field.collection]) {
    joins[field.collection] = [join]
  } else {
    joins[field.collection]?.push(join)
  }
}
