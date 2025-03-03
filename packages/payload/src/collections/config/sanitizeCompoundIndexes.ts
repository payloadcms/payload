import type { FlattenedField } from '../../fields/config/types.js'
import type { CompoundIndex, SanitizedCompoundIndex } from './types.js'

import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js'
import { getFieldByPath } from '../../utilities/getFieldByPath.js'

export const sanitizeCompoundIndexes = ({
  fields,
  indexes,
}: {
  fields: FlattenedField[]
  indexes: CompoundIndex[]
}): SanitizedCompoundIndex[] => {
  const sanitizedCompoundIndexes: SanitizedCompoundIndex[] = []

  for (const index of indexes) {
    const sanitized: SanitizedCompoundIndex = { fields: [], unique: index.unique ?? false }
    for (const path of index.fields) {
      const field = getFieldByPath({ fields, path })

      if (!field) {
        throw new InvalidConfiguration(`Field ${path} was not found`)
      }

      sanitized.fields.push({ field, path })
    }

    sanitizedCompoundIndexes.push(sanitized)
  }

  return sanitizedCompoundIndexes
}
