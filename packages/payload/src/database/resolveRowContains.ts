import type { FlattenedArrayField, FlattenedField } from '../fields/config/types.js'
import type { Operator, Where, WhereField } from '../types/index.js'

import { QueryError } from '../errors/QueryError.js'
import { isNestedRelationshipQuery } from './isNestedRelationshipQuery.js'

const queryableFieldTypes = new Set([
  'checkbox',
  'code',
  'date',
  'email',
  'number',
  'radio',
  'select',
  'slug',
  'text',
  'textarea',
])
const comparisonOperators = new Set([
  'equals',
  'exists',
  'greater_than',
  'greater_than_equal',
  'in',
  'less_than',
  'less_than_equal',
  'not_equals',
  'not_in',
])

export function getFieldInGroups({
  fields,
  path,
}: {
  fields: FlattenedField[]
  path: string
}): { field: FlattenedField; parentIsLocalized: boolean } | undefined {
  let parentIsLocalized = false
  const segments = path.split('.')

  for (const [index, name] of segments.entries()) {
    const field = fields.find((field) => field.name === name)
    if (!field) {
      return
    }
    if (index === segments.length - 1) {
      return { field, parentIsLocalized }
    }
    if (field.type !== 'group' && field.type !== 'tab') {
      return
    }

    parentIsLocalized ||= Boolean(field.localized)
    fields = field.flattenedFields
  }
}

export function isRowContainsField({
  fields,
  path,
}: {
  fields: FlattenedField[]
  path: string
}): boolean {
  const field = getFieldInGroups({ fields, path })?.field

  return field?.type === 'array'
}

export function resolveRowContains({
  field,
  path,
  where,
}: {
  field: FlattenedArrayField
  path: string
  where: Where
}) {
  return {
    flattenedFields: field.flattenedFields,
    where: normalizeWhere({ flattenedFields: field.flattenedFields, path, where }),
  }
}

function normalizeWhere({
  flattenedFields,
  path,
  where,
}: {
  flattenedFields: FlattenedField[]
  path: string
  where: Where
}): Where {
  const conditions: Where[] = []

  for (const [key, value] of Object.entries(where)) {
    const operator = key.toLowerCase()
    if (operator === 'and' || operator === 'or') {
      if (
        !Array.isArray(value) ||
        !value.length ||
        !value.every((entry) => isNestedRelationshipQuery(entry) && Object.keys(entry).length)
      ) {
        throw new QueryError([{ path: `${path}.contains.${key}` }])
      }
      conditions.push({
        [operator]: value.map((where) => normalizeWhere({ flattenedFields, path, where })),
      })
      continue
    }

    const schemaPath = key.replace(/__/g, '.')
    const field = getFieldInGroups({ fields: flattenedFields, path: schemaPath })?.field

    if (
      !field ||
      key === 'id' ||
      !queryableFieldTypes.has(field.type) ||
      ('hasMany' in field && field.hasMany) ||
      ('virtual' in field && field.virtual) ||
      !isNestedRelationshipQuery(value) ||
      !Object.keys(value).length
    ) {
      throw new QueryError([{ path: `${path}.contains.${key}` }])
    }

    const predicate = { ...value } as WhereField
    for (const [operator, operand] of Object.entries(value)) {
      const isComparison = comparisonOperators.has(operator)
      const isTextMatch =
        ['contains', 'like', 'not_like'].includes(operator) &&
        ['code', 'email', 'slug', 'text', 'textarea'].includes(field.type) &&
        typeof operand === 'string'
      const isMembership = operator === 'in' || operator === 'not_in'
      const values = isMembership ? operand : [operand]
      if (
        (!isComparison && !isTextMatch) ||
        !Array.isArray(values) ||
        !values.every(
          (value) => value === null || ['boolean', 'number', 'string'].includes(typeof value),
        ) ||
        (field.type === 'number' &&
          operator !== 'exists' &&
          values.some(
            (value) =>
              value !== null &&
              ((typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) ||
                !Number.isFinite(Number(value))),
          )) ||
        (field.type === 'date' &&
          operator !== 'exists' &&
          values.some(
            (value) =>
              value !== null && (typeof value !== 'string' || Number.isNaN(Date.parse(value))),
          ))
      ) {
        throw new QueryError([{ path: `${path}.contains.${key}.${operator}` }])
      }

      if (field.type === 'number' && operator !== 'exists') {
        const numbers = values.map((value) => (value === null ? null : Number(value)))

        predicate[operator as Operator] = isMembership ? numbers : (numbers[0] ?? null)
      }
    }

    conditions.push({ [schemaPath]: predicate })
  }

  if (conditions.length === 1) {
    return conditions[0]!
  }
  return conditions.length ? { and: conditions } : {}
}

export function hasRowContains({
  isRowField,
  where,
}: {
  isRowField: (path: string) => boolean
  where: Where
}): boolean {
  return Object.entries(where).some(([path, constraint]) => {
    if (Array.isArray(constraint)) {
      return constraint.some((where) => hasRowContains({ isRowField, where }))
    }
    return isNestedRelationshipQuery(constraint?.contains) && isRowField(path.replace(/__/g, '.'))
  })
}
