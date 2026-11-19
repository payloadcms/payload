import type { FlattenedField } from '../../fields/config/types.js'
import type { CompoundIndex, SanitizedCompoundIndex } from './types.js'

import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js'
import { getFieldByPath } from '../../utilities/getFieldByPath.js'

/** Resolves compound index paths and rejects configurations that cannot be validated reliably. */
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
      const result = getFieldByPath({ fields, path })

      if (!result) {
        throw new InvalidConfiguration(`Field ${path} was not found`)
      }

      const { field, localizedPath, pathHasLocalized } = result

      if (['array', 'blocks', 'group', 'tab'].includes(field.type)) {
        throw new InvalidConfiguration(
          `Compound index on ${field.type} cannot be set. Path: ${localizedPath}`,
        )
      }

      if (index.unique && index.requireExists?.length) {
        const segments = path.split('.')

        for (let length = 1; length < segments.length; length++) {
          const parentPath = segments.slice(0, length).join('.')
          const parent = getFieldByPath({ fields, path: parentPath })

          if (parent && ['array', 'blocks'].includes(parent.field.type)) {
            throw new InvalidConfiguration(
              `Unique compound indexes with requireExists cannot index paths within arrays or blocks. Path: ${path}`,
            )
          }
        }
      }

      sanitized.fields.push({ field, localizedPath, path, pathHasLocalized })
    }

    if (index.requireExists) {
      sanitized.requireExists = index.requireExists.map((path) => {
        const result = getFieldByPath({ fields, path })

        if (!result) {
          throw new InvalidConfiguration(`Field ${path} in requireExists was not found`)
        }

        const { localizedPath, pathHasLocalized } = result

        return { localizedPath, path, pathHasLocalized }
      })
    }

    sanitizedCompoundIndexes.push(sanitized)
  }

  return sanitizedCompoundIndexes
}
