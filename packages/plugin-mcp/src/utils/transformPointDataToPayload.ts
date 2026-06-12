/**
 * Transforms incoming MCP tool data from object format to tuple array format.
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
      transformed[key] = value.map((item) =>
        typeof item === 'object'
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
