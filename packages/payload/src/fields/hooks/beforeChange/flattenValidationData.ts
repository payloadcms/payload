import type { Payload } from '../../../index.js'
import type { JsonObject } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { deepCopyObjectSimple } from '../../../utilities/deepCopyObject.js'
import { traverseFields } from '../../../utilities/traverseFields.js'
import { fieldAffectsData, fieldShouldBeLocalized } from '../../config/types.js'
import { getPointCoordinates } from '../../getPointCoordinates.js'

type FieldRef = { name: string; ref: JsonObject }

type Args = {
  config: Payload['config']
  data: JsonObject
  fields: (Field | TabAsField)[]
  locale: string
  /** Convert point values when projecting a raw snapshot from the database. */
  normalizePointFields?: boolean
  parentIsLocalized?: boolean
}

/** Projects validation context to one locale without running hooks or changing the write data. */
export function flattenValidationData({
  config,
  data,
  fields,
  locale,
  normalizePointFields = false,
  parentIsLocalized = false,
}: Args): JsonObject {
  // Each locale needs its own projection. Merged contexts also retain source array references.
  const result = deepCopyObjectSimple(data)
  const localizedFields: FieldRef[] = []
  const pointFields: FieldRef[] = []

  traverseFields({
    callback: ({ field, parentIsLocalized, ref }) => {
      if (!fieldAffectsData(field) || !field.name) {
        return
      }

      if (fieldShouldBeLocalized({ field, parentIsLocalized })) {
        localizedFields.push({ name: field.name, ref: ref as JsonObject })
      }
      if (normalizePointFields && field.type === 'point') {
        pointFields.push({ name: field.name, ref: ref as JsonObject })
      }
    },
    config,
    fields,
    fillEmpty: false,
    parentIsLocalized,
    ref: result,
  })

  // Keep locale maps intact while traversing, then project children before their containers.
  for (const { name, ref } of localizedFields.reverse()) {
    const value = ref[name]

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      ref[name] = value[locale]
    }
  }

  for (const { name, ref } of pointFields) {
    ref[name] = getPointCoordinates({ value: ref[name] })
  }

  return result
}
