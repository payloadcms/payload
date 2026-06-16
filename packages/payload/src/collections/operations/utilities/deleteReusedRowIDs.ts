import type { SanitizedConfig } from '../../../config/types.js'
import type { Field } from '../../../fields/config/types.js'

import { traverseFields } from '../../../utilities/traverseFields.js'

const forEachArrayOrBlockRow = ({
  config,
  data,
  fields,
  onRow,
}: {
  config: SanitizedConfig
  data: Record<string, unknown>
  fields: Field[]
  onRow: (row: Record<string, unknown>) => void
}): void => {
  traverseFields({
    callback: ({ field, ref }) => {
      if (
        (field.type !== 'array' && field.type !== 'blocks') ||
        !('name' in field) ||
        !field.name ||
        !ref ||
        typeof ref !== 'object'
      ) {
        return
      }

      const value = (ref as Record<string, unknown>)[field.name]

      const visitRows = (rows: unknown): void => {
        if (!Array.isArray(rows)) {
          return
        }
        for (const row of rows) {
          if (row && typeof row === 'object') {
            onRow(row as Record<string, unknown>)
          }
        }
      }

      if (Array.isArray(value)) {
        visitRows(value)
      } else if (value && typeof value === 'object') {
        for (const localeValue of Object.values(value as Record<string, unknown>)) {
          visitRows(localeValue)
        }
      }
    },
    config,
    fields,
    fillEmpty: false,
    ref: data,
  })
}

export const deleteReusedRowIDs = ({
  config,
  data,
  existingDoc,
  fields,
}: {
  config: SanitizedConfig
  data: Record<string, unknown>
  existingDoc: Record<string, unknown>
  fields: Field[]
}): Record<string, unknown> => {
  const existingRowIDs = new Set<string>()

  forEachArrayOrBlockRow({
    config,
    data: existingDoc,
    fields,
    onRow: (row) => {
      if (typeof row.id === 'string') {
        existingRowIDs.add(row.id)
      }
    },
  })

  forEachArrayOrBlockRow({
    config,
    data,
    fields,
    onRow: (row) => {
      if (typeof row.id === 'string' && !existingRowIDs.has(row.id)) {
        delete row.id
      }
    },
  })

  return data
}
