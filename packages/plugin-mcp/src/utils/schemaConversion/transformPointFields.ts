import type { JSONSchema4 } from 'json-schema'

export function transformPointFieldsForMCP(schema: JSONSchema4): JSONSchema4 {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  const transformed = { ...schema }

  if (transformed.properties && typeof transformed.properties === 'object') {
    transformed.properties = Object.fromEntries(
      Object.entries(transformed.properties).map(([key, value]) => {
        const isArrayType =
          value.type === 'array' || (Array.isArray(value.type) && value.type.includes('array'))

        if (
          value &&
          typeof value === 'object' &&
          isArrayType &&
          Array.isArray(value.items) &&
          value.items.length === 2 &&
          value.items.every((item: JSONSchema4) => item?.type === 'number')
        ) {
          // Transform to object format
          const isNullable = Array.isArray(value.type) && value.type.includes('null')

          return [
            key,
            {
              type: isNullable ? ['object', 'null'] : 'object',
              description: value.description || 'Geographic coordinates (longitude, latitude)',
              properties: {
                latitude: { type: 'number', description: 'Latitude coordinate' },
                longitude: { type: 'number', description: 'Longitude coordinate' },
              },
              required: ['longitude', 'latitude'],
            },
          ]
        }

        return [key, transformPointFieldsForMCP(value)]
      }),
    )
  }

  if (
    transformed.items &&
    typeof transformed.items === 'object' &&
    !Array.isArray(transformed.items)
  ) {
    transformed.items = transformPointFieldsForMCP(transformed.items)
  }

  return transformed
}
