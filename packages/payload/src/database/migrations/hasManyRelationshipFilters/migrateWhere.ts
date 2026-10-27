import type { SanitizedConfig } from '../../../config/types.js'
import type { FlattenedField } from '../../../fields/config/types.js'
import type { Where, WhereField } from '../../../types/index.js'

import { getFieldByPath } from '../../../utilities/getFieldByPath.js'

/** Converts saved Admin equality filters only where the current schema offers membership filters. */
export const migrateWhere = ({
  config,
  fields,
  where,
}: {
  config?: SanitizedConfig
  fields: FlattenedField[]
  where: Where
}): Where => {
  if (!where || typeof where !== 'object' || Array.isArray(where)) {
    return where
  }

  const result: Where = { ...where }
  let hasChanged = false

  for (const [path, condition] of Object.entries(where)) {
    if ((path === 'and' || path === 'or') && Array.isArray(condition)) {
      const migrated = condition.map((clause: Where) =>
        migrateWhere({ config, fields, where: clause }),
      )

      if (migrated.some((clause, index) => clause !== condition[index])) {
        result[path] = migrated
        hasChanged = true
      }
      continue
    }

    if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
      continue
    }

    const field = getFieldByPath({ config, fields, includeRelationships: true, path })?.field

    if (
      !field ||
      (field.type !== 'relationship' && field.type !== 'upload') ||
      !field.hasMany ||
      typeof field.relationTo !== 'string' ||
      field.virtual
    ) {
      continue
    }

    const migratedCondition: WhereField = { ...condition }
    let hasChangedCondition = false

    for (const [previous, next] of [
      ['equals', 'in'],
      ['not_equals', 'not_in'],
    ] as const) {
      if (!Object.hasOwn(condition, previous)) {
        continue
      }

      if (Object.hasOwn(condition, next)) {
        throw new Error(
          `Cannot migrate saved filter for "${path}": both "${previous}" and "${next}" are present. Split these constraints into separate AND conditions before migrating.`,
        )
      }

      const value = condition[previous]

      migratedCondition[next] = Array.isArray(value) ? value : [value]
      delete migratedCondition[previous]
      hasChangedCondition = true
    }

    if (hasChangedCondition) {
      result[path] = migratedCondition
      hasChanged = true
    }
  }

  return hasChanged ? result : where
}
