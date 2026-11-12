/**
 * Transforms incoming data from object format to tuple array format.
 * Converts { longitude: number, latitude: number } back to [longitude, latitude]
 * for Payload's internal point field representation.
 */
export function transformPointDataToPayload(
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    return data
  }

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
      // Transform to tuple array [longitude, latitude]
      transformed[key] = [value.longitude, value.latitude]
    } else if (Array.isArray(value)) {
      transformed[key] = transformArray(value)
    } else if (value && typeof value === 'object') {
      transformed[key] = transformPointDataToPayload(value as Record<string, unknown>)
    } else {
      transformed[key] = value
    }
  }

  return transformed
}

/**
 * Arrays can be nested (e.g. coordinate lists stored in a `json` field), so inner
 * arrays must stay arrays instead of being converted to index-keyed objects.
 */
function transformArray(value: unknown[]): unknown[] {
  return value.map((item) => {
    if (Array.isArray(item)) {
      return transformArray(item)
    }

    if (item && typeof item === 'object') {
      return transformPointDataToPayload(item as Record<string, unknown>)
    }

    return item
  })
}
