import type { FlattenedField } from 'payload'

type Expression = Record<string, unknown>

/** A deliberately narrow scalar subset lets equality lookups retain Mongo's native SBE path. */
export const compileProjectionScalarMatch = ({
  fields,
  query,
  root = '$$candidate',
}: {
  fields: FlattenedField[]
  query: Record<string, any>
  root?: string
}): Expression | undefined => {
  const conditions: Expression[] = []

  for (const [path, condition] of Object.entries(query)) {
    if (path === '$and' || path === '$or') {
      if (!Array.isArray(condition)) {
        return undefined
      }
      const children = condition.map((query) =>
        compileProjectionScalarMatch({ fields, query, root }),
      )
      if (children.some((child) => !child)) {
        return undefined
      }
      conditions.push({ [path]: children })
      continue
    }
    if (path === '$expr' && typeof condition === 'boolean') {
      conditions.push({ $literal: condition })
      continue
    }
    const [name, locale, ...rest] = path.split('.')
    const field = fields.find((field) => field.name === name)
    const isMetadata = /^_branchProjection\.(?:branchKey|logicalID|isVisible)$/.test(path)
    const isScalar =
      field &&
      [
        'checkbox',
        'code',
        'date',
        'email',
        'number',
        'radio',
        'select',
        'text',
        'textarea',
      ].includes(field.type) &&
      !('hasMany' in field && field.hasMany)
    if (!isMetadata && (!isScalar || rest.length || (locale && !field.localized))) {
      return undefined
    }
    const raw = `${root}.${path}`
    const operand = { $ifNull: [raw, null] }
    const operators =
      condition &&
      typeof condition === 'object' &&
      !(condition instanceof Date) &&
      !(condition instanceof RegExp) &&
      !Array.isArray(condition)
        ? condition
        : { $eq: condition }

    for (const [operator, value] of Object.entries(operators)) {
      if (operator === '$options') {
        continue
      }
      if (['$eq', '$in', '$ne', '$nin'].includes(operator)) {
        if ((operator === '$in' || operator === '$nin') && !Array.isArray(value)) {
          return undefined
        }
        const values = Array.isArray(value) ? value : [value]
        if (
          values.some(
            (item) =>
              item !== null &&
              !['boolean', 'number', 'string'].includes(typeof item) &&
              !(item instanceof Date),
          )
        ) {
          return undefined
        }
        const comparison =
          operator === '$nin'
            ? { $not: [{ $in: [operand, { $literal: value }] }] }
            : { [operator]: [operand, { $literal: value }] }
        conditions.push(comparison)
      } else if (['$gt', '$gte', '$lt', '$lte'].includes(operator)) {
        const type =
          value instanceof Date
            ? 'date'
            : typeof value === 'number'
              ? 'number'
              : typeof value === 'string'
                ? 'string'
                : undefined
        if (!type) {
          return undefined
        }
        conditions.push({
          $and: [
            type === 'number' ? { $isNumber: raw } : { $eq: [{ $type: raw }, type] },
            { [operator]: [raw, { $literal: value }] },
          ],
        })
      } else if (operator === '$exists' && typeof value === 'boolean') {
        conditions.push({ [value ? '$ne' : '$eq']: [{ $type: raw }, 'missing'] })
      } else if (operator === '$regex') {
        if (!(value instanceof RegExp) && typeof value !== 'string') {
          return undefined
        }
        const options = value instanceof RegExp ? value.flags : (operators.$options ?? '')
        if (typeof options !== 'string' || /[^imsx]/.test(options)) {
          return undefined
        }
        conditions.push({
          $and: [
            { $eq: [{ $type: raw }, 'string'] },
            {
              $regexMatch: {
                input: { $cond: [{ $eq: [{ $type: raw }, 'string'] }, raw, ''] },
                options,
                regex: value instanceof RegExp ? value.source : value,
              },
            },
          ],
        })
      } else {
        return undefined
      }
    }
  }
  return conditions.length ? { $and: conditions } : { $literal: true }
}
