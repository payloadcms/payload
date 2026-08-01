import type { SanitizedConfig } from '../config/types.js'

import { fieldIsVirtual } from '../fields/config/types.js'

export const prepareCollectionOperationData = ({
  collection,
  config,
  data,
}: {
  collection: string
  config: SanitizedConfig
  data: Record<string, unknown>
}): Record<string, unknown> =>
  transformPointDataToPayload(
    stripVirtualFields({
      data,
      fieldNames:
        config.collections
          .find(({ slug }) => slug === collection)
          ?.flattenedFields.filter((field) => 'name' in field && fieldIsVirtual(field))
          .map((field) => field.name) ?? [],
    }),
  )

export const prepareGlobalOperationData = ({
  config,
  data,
  global,
}: {
  config: SanitizedConfig
  data: Record<string, unknown>
  global: string
}): Record<string, unknown> =>
  transformPointDataToPayload(
    stripVirtualFields({
      data,
      fieldNames:
        config.globals
          .find(({ slug }) => slug === global)
          ?.flattenedFields.filter((field) => 'name' in field && fieldIsVirtual(field))
          .map((field) => field.name) ?? [],
    }),
  )

const stripVirtualFields = ({
  data,
  fieldNames,
}: {
  data: Record<string, unknown>
  fieldNames: string[]
}): Record<string, unknown> => {
  const stripped = { ...data }

  for (const name of fieldNames) {
    delete stripped[name]
  }

  return stripped
}

const transformPointDataToPayload = (data: Record<string, unknown>): Record<string, unknown> => {
  const transformed: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (
      value &&
      typeof value === 'object' &&
      'longitude' in value &&
      'latitude' in value &&
      typeof value.longitude === 'number' &&
      typeof value.latitude === 'number'
    ) {
      transformed[key] = [value.longitude, value.latitude]
    } else if (Array.isArray(value)) {
      transformed[key] = value.map((item) =>
        item && typeof item === 'object'
          ? transformPointDataToPayload(item as Record<string, unknown>)
          : item,
      )
    } else if (value && typeof value === 'object') {
      transformed[key] = transformPointDataToPayload(value as Record<string, unknown>)
    } else {
      transformed[key] = value
    }
  }

  return transformed
}
