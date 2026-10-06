import type { Field, TabAsField } from '../fields/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized } from '../fields/config/types.js'

/** Transform locale maps while respecting localized parents, rows, blocks and layout fields. */
export function mapLocalizedFields({
  data,
  fields,
  req,
  transform,
}: {
  data: JsonObject
  fields: (Field | TabAsField)[]
  req: PayloadRequest
  transform: (args: { name: string; value: unknown }) => unknown
}): JsonObject {
  const result = { ...data }

  for (const field of fields) {
    if (fieldAffectsData(field) && field.name) {
      if (fieldShouldBeLocalized({ field, parentIsLocalized: false })) {
        result[field.name] = transform({ name: field.name, value: data[field.name] })
        continue
      }

      const value = data[field.name]

      if (field.type === 'array' && Array.isArray(value)) {
        result[field.name] = value.map((row) =>
          mapLocalizedFields({ data: row, fields: field.fields, req, transform }),
        )
      } else if (field.type === 'blocks' && Array.isArray(value)) {
        result[field.name] = value.map((row) => {
          const block = field.blocks.find(
            (block) => (typeof block === 'string' ? block : block.slug) === row.blockType,
          )
          const blockFields =
            typeof block === 'string' ? req.payload.blocks[block]?.fields : block?.fields

          return blockFields
            ? mapLocalizedFields({ data: row, fields: blockFields, req, transform })
            : row
        })
      } else if (
        (field.type === 'group' || field.type === 'tab') &&
        value &&
        typeof value === 'object'
      ) {
        result[field.name] = mapLocalizedFields({
          data: value,
          fields: field.fields,
          req,
          transform,
        })
      }
    } else if ('fields' in field) {
      Object.assign(
        result,
        mapLocalizedFields({ data: result, fields: field.fields, req, transform }),
      )
    } else if (field.type === 'tabs') {
      Object.assign(
        result,
        mapLocalizedFields({
          data: result,
          fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' as const })),
          req,
          transform,
        }),
      )
    }
  }

  return result
}
