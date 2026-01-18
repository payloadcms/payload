import type { FlattenedField, PayloadRequest } from '@ruya.sa/payload'

import type { FromCSVFunction } from '../types.js'

import { processRichTextField } from './processRichTextField.js'

type UnflattenArgs = {
  data: Record<string, unknown>
  fields: FlattenedField[]
  fromCSVFunctions?: Record<string, FromCSVFunction>
  req: PayloadRequest
}

export const unflattenObject = ({
  data,
  fields,
  fromCSVFunctions = {},
  req,
}: UnflattenArgs): Record<string, unknown> => {
  if (!data || typeof data !== 'object') {
    return {}
  }

  const result: Record<string, unknown> = {}

  // Sort keys to ensure array indices are processed in order
  const sortedKeys = Object.keys(data).sort((a, b) => {
    // Extract array indices from flattened keys (e.g., "field_0_subfield" -> "0")
    const aMatch = a.match(/_(\d+)(?:_|$)/)
    const bMatch = b.match(/_(\d+)(?:_|$)/)

    if (aMatch && bMatch && aMatch.index !== undefined && bMatch.index !== undefined) {
      const aBase = a.substring(0, aMatch.index)
      const bBase = b.substring(0, bMatch.index)

      if (aBase === bBase) {
        return (parseInt(aMatch?.[1] ?? '0', 10) || 0) - (parseInt(bMatch?.[1] ?? '0', 10) || 0)
      }
    }

    return a.localeCompare(b)
  })

  for (const flatKey of sortedKeys) {
    let value = data[flatKey]

    // Skip undefined values but keep null for required field validation
    if (value === undefined) {
      continue
    }

    // Check if this is a _relationTo key for a polymorphic relationship
    if (flatKey.endsWith('_relationTo')) {
      const baseKey = flatKey.replace(/_relationTo$/, '')
      const idKey = `${baseKey}_id`

      // Check if this is a polymorphic relationship field
      const isPolymorphic = fields.some(
        (field) =>
          field.name === baseKey &&
          field.type === 'relationship' &&
          'relationTo' in field &&
          Array.isArray(field.relationTo),
      )

      if (isPolymorphic) {
        // Check if we've already processed this field
        if (baseKey in result) {
          // Skipping because already processed
          continue
        }

        // If the corresponding _id key is undefined, skip processing entirely
        // This prevents creating empty objects when we should preserve existing data
        if (!(idKey in data) || data[idKey] === undefined) {
          continue
        }
      }
    }

    // Check if this is a _id key for a polymorphic relationship where _relationTo is undefined
    if (flatKey.endsWith('_id')) {
      const baseKey = flatKey.replace(/_id$/, '')
      const relationToKey = `${baseKey}_relationTo`

      // Check if this is a polymorphic relationship field
      const isPolymorphic = fields.some(
        (field) =>
          field.name === baseKey &&
          field.type === 'relationship' &&
          'relationTo' in field &&
          Array.isArray(field.relationTo),
      )

      if (isPolymorphic) {
        // If the corresponding _relationTo key is undefined, skip processing entirely
        // This prevents creating empty objects when we should preserve existing data
        if (!(relationToKey in data) || data[relationToKey] === undefined) {
          continue
        }
      }
    }

    // Apply fromCSV function if available
    if (fromCSVFunctions[flatKey]) {
      value = fromCSVFunctions[flatKey]({
        columnName: flatKey,
        data,
        value,
      })
    }

    // Parse the flat key into segments
    // Example: "blocks_0_content_text" -> ["blocks", "0", "content", "text"]
    const segments = flatKey.split('_')
    let current: Record<string, unknown> = result

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      if (!segment) {
        continue
      } // Skip empty segments

      const nextSegment = segments[i + 1]
      const isLast = i === segments.length - 1

      // Check if next segment is a numeric array index (e.g., "0", "1", "2")
      const isArrayIndex = nextSegment !== undefined && /^\d+$/.test(nextSegment)

      if (isLast) {
        // Special handling for blockType suffix in blocks
        if (segment === 'blockType' && i >= 3) {
          // Pattern: blocks_0_hero_blockType -> set blockType on the block
          const blockFieldName = segments[0] // 'blocks'
          const isBlockField = fields.some(
            (field) => field.name === blockFieldName && field.type === 'blocks',
          )

          if (isBlockField && segments[1]?.match(/^\d+$/)) {
            // This is a block type field
            const parent = getParentObject(result, segments.slice(0, 2))
            if (parent && typeof parent === 'object') {
              parent.blockType = value
            }
            continue
          }
        }

        // Special handling for relationship fields with _id suffix
        if (segment === 'id' && i > 0) {
          const parentKey = segments[i - 1]
          // Check if the previous segment is an array index
          const prevIsIndex = parentKey ? /^\d+$/.test(parentKey) : false

          if (!prevIsIndex) {
            // Check if this is a relationship field
            const isRelationship = fields.some(
              (field) => field.name === parentKey && field.type === 'relationship',
            )

            if (isRelationship) {
              // Check if this is a polymorphic relationship field
              const field = fields.find((f) => f.name === parentKey && f.type === 'relationship')
              const isPolymorphic =
                field && 'relationTo' in field && Array.isArray(field.relationTo)

              if (isPolymorphic) {
                // For polymorphic relationships, check for the corresponding _relationTo field
                const relationToKey = segments.slice(0, i).concat('relationTo').join('_')
                const relationToValue = data[relationToKey]

                // This is a polymorphic relationship
                const parent = getParentObject(result, segments.slice(0, i - 1))
                if (parent && parentKey && typeof parent === 'object') {
                  // Both fields must be defined to create/update the relationship
                  // If either is undefined, skip the field entirely (preserve existing data)
                  if (value !== undefined && relationToValue !== undefined) {
                    // Check if both are explicitly null
                    if (relationToValue === null && value === null) {
                      // Only set to null if explicitly null (user typed "null" in CSV)
                      parent[parentKey] = null
                    } else if (relationToValue || value) {
                      // At least one has a value, create the relationship
                      parent[parentKey] = {
                        relationTo: relationToValue,
                        value, // This will be transformed to proper format in postProcess
                      }
                    }
                    // If both are empty strings, don't set the field (handled by not meeting the above conditions)
                  }
                  // If either is undefined, don't set the field at all (preserve existing data)
                }
                continue
              } else if (!isPolymorphic) {
                // Non-polymorphic relationship
                const parent = getParentObject(result, segments.slice(0, i - 1))
                if (parent && parentKey && typeof parent === 'object') {
                  parent[parentKey] = value
                }
                continue
              }
            }
          }
        }

        // Special handling for _relationTo suffix (skip it, handled above)
        if (segment === 'relationTo' && i > 0) {
          const parentKey = segments[i - 1]
          if (parentKey && !parentKey.match(/^\d+$/)) {
            const field = fields.find((f) => f.name === parentKey && f.type === 'relationship')
            const isPolymorphic = field && 'relationTo' in field && Array.isArray(field.relationTo)

            if (isPolymorphic) {
              // For polymorphic relationships, this is handled when processing the _id field
              // Skip it entirely
              continue
            }
          }
        }

        current[segment] = value
      } else if (isArrayIndex && nextSegment !== undefined) {
        // Initialize array if needed
        if (!current[segment] || !Array.isArray(current[segment])) {
          current[segment] = []
        }

        const arrayIndex = parseInt(nextSegment)
        const arr = current[segment] as unknown[]

        // Ensure array has sufficient length
        while (arr.length <= arrayIndex) {
          arr.push(null)
        }

        // Handle array of objects
        if (arr[arrayIndex] === null || arr[arrayIndex] === undefined) {
          arr[arrayIndex] = {}
        }

        // Check if this is a blocks field with block slug pattern
        const isBlocksField = fields.some((f) => f.name === segment && f.type === 'blocks')
        if (isBlocksField && i + 3 < segments.length) {
          // Pattern: blocks_0_hero_title where 'hero' is the block slug
          const blockSlug = segments[i + 2]
          const blockFieldName = segments[i + 3]

          if (blockSlug && blockFieldName) {
            const blockObject = arr[arrayIndex] as Record<string, unknown>

            // Set the blockType based on the slug
            blockObject.blockType = blockSlug

            // Handle nested block fields
            if (i + 3 === segments.length - 1) {
              // Direct field on the block
              blockObject[blockFieldName] = value
            } else {
              // Nested field in the block
              if (!blockObject[blockFieldName] || typeof blockObject[blockFieldName] !== 'object') {
                blockObject[blockFieldName] = {}
              }
              // Continue processing remaining segments
              current = blockObject[blockFieldName] as Record<string, unknown>
              i = i + 3 // Skip index, slug, and field name
              continue // Continue processing the remaining segments (not break!)
            }
            break
          }
        }

        // If this is the last segment after the index, set the value
        if (i + 2 === segments.length - 1) {
          const lastSegment = segments[segments.length - 1]
          if (lastSegment && arr[arrayIndex] && typeof arr[arrayIndex] === 'object') {
            ;(arr[arrayIndex] as Record<string, unknown>)[lastSegment] = value
          }
          break
        } else if (i + 1 === segments.length - 1) {
          // Direct array value (e.g., tags_0 = "value")
          arr[arrayIndex] = value
          break
        } else {
          // Continue traversing into the array element
          current = arr[arrayIndex] as Record<string, unknown>
          i++ // skip the index segment
        }
      } else {
        // Regular object property
        // Check if this segment is already set to null (polymorphic relationship already processed)
        if (current[segment] === null && isLast && segment === 'relationTo') {
          // This is a relationTo for a polymorphic field that was already set to null
          // Skip creating a new object
          continue
        }

        if (
          !current[segment] ||
          typeof current[segment] !== 'object' ||
          Array.isArray(current[segment])
        ) {
          current[segment] = {}
        }

        // Handle special cases for polymorphic relationships
        if (segment === 'relationTo' && i > 0 && segments[i - 1]?.match(/^\d+$/)) {
          // This is part of a polymorphic relationship array
          current[segment] = value
        } else if (
          typeof current[segment] === 'object' &&
          !Array.isArray(current[segment]) &&
          current[segment] !== null
        ) {
          current = current[segment] as Record<string, unknown>
        }
      }
    }
  }

  try {
    // Post-process to handle special structures
    postProcessDocument(result, fields)
  } catch (err) {
    // Log but don't throw - return partially processed result

    req.payload.logger.error({
      err,
      msg: '[plugin-import-export] Error in postProcessDocument',
    })
  }

  return result
}

const getParentObject = (
  obj: Record<string, unknown>,
  segments: string[],
): Record<string, unknown> | undefined => {
  let current: Record<string, unknown> = obj

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const nextSegment = segments[i + 1]

    if (!segment) {
      continue
    }

    if (nextSegment && /^\d+$/.test(nextSegment)) {
      const arrayIndex = parseInt(nextSegment)
      const arr = current[segment] as unknown[]

      if (Array.isArray(arr) && arr[arrayIndex]) {
        current = arr[arrayIndex] as Record<string, unknown>
        i++ // Skip the index
      } else {
        return undefined
      }
    } else {
      const next = current[segment]
      if (typeof next === 'object' && next !== null && !Array.isArray(next)) {
        current = next as Record<string, unknown>
      } else {
        return undefined
      }
    }
  }

  return current
}

const postProcessDocument = (doc: Record<string, unknown>, fields: FlattenedField[]): void => {
  // Handle localized fields - transform from field_locale to { field: { locale: value } }
  // This is the format Payload stores in the database
  const localizedFields = fields.filter((field) => field.localized)
  const processedLocalizedFields = new Set<string>()

  for (const field of localizedFields) {
    if (processedLocalizedFields.has(field.name)) {
      continue
    }

    // Look for all locale-specific keys for this field
    const localePattern = new RegExp(`^${field.name}_([a-z]{2}(?:_[A-Z]{2})?)$`)
    const localeData: Record<string, unknown> = {}
    const keysToDelete: string[] = []

    for (const [key, value] of Object.entries(doc)) {
      const match = key.match(localePattern)
      if (match && match[1]) {
        const locale = match[1]
        localeData[locale] = value
        keysToDelete.push(key)
      }
    }

    // If we found locale-specific data, restructure it as Payload expects
    if (Object.keys(localeData).length > 0) {
      // Payload stores localized fields as nested objects: { field: { en: 'value', es: 'value' } }
      doc[field.name] = localeData
      keysToDelete.forEach((key) => delete doc[key])
      processedLocalizedFields.add(field.name)
    }
  }

  // Handle number fields with hasMany - convert string arrays to number arrays
  const numberFields = fields.filter((field) => field.type === 'number' && field.hasMany)
  for (const field of numberFields) {
    const value = doc[field.name]

    // Skip if field doesn't exist in document
    if (!(field.name in doc)) {
      continue
    }

    // Handle comma-separated string (e.g., "1,2,3,4,5")
    if (typeof value === 'string' && value.includes(',')) {
      doc[field.name] = value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v !== '')
        .map((v) => {
          const num = parseFloat(v)
          return isNaN(num) ? 0 : num
        })
    }
    // Handle array of values from indexed columns (e.g., field_0, field_1, etc.)
    else if (Array.isArray(value)) {
      // Filter out null, undefined, and empty string values, then convert to numbers
      doc[field.name] = value
        .filter((v) => v !== null && v !== undefined && v !== '')
        .map((v) => {
          if (typeof v === 'string') {
            const num = parseFloat(v)
            return isNaN(num) ? 0 : num
          }
          return v
        })
    }
    // Handle single value for hasMany (convert to array)
    else if (value !== null && value !== undefined && value !== '') {
      const num = typeof value === 'string' ? parseFloat(value) : value
      doc[field.name] = isNaN(num as number) ? [] : [num]
    }
    // Handle empty/null values - convert to empty array for hasMany
    else {
      doc[field.name] = []
    }
  }

  // Handle relationship fields with hasMany - convert comma-separated IDs to arrays
  const relationshipFields = fields.filter(
    (field) =>
      (field.type === 'relationship' || field.type === 'upload') &&
      field.hasMany === true &&
      !Array.isArray(field.relationTo), // Skip polymorphic for now, handled separately
  )
  for (const field of relationshipFields) {
    const value = doc[field.name]

    // Handle comma-separated string of IDs (e.g., "id1,id2,id3")
    if (typeof value === 'string' && value.includes(',')) {
      doc[field.name] = value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v !== '')
    }
    // Keep array as-is if already an array
    else if (Array.isArray(value)) {
      doc[field.name] = value.filter((v) => v !== null && v !== undefined && v !== '')
    }
    // Convert single value to array for hasMany
    else if (value !== null && value !== undefined && value !== '') {
      doc[field.name] = [value]
    }
  }

  // Handle polymorphic relationships - transform from flat structure to proper format
  for (const [key, value] of Object.entries(doc)) {
    // Handle arrays of polymorphic relationships
    if (Array.isArray(value)) {
      // Check if this array contains polymorphic relationship objects
      const hasPolymorphicItems = value.some(
        (item) => typeof item === 'object' && item !== null && 'relationTo' in item,
      )

      if (hasPolymorphicItems) {
        // Filter out null/invalid polymorphic items and transform valid ones
        const processedArray = []
        for (let i = 0; i < value.length; i++) {
          const item = value[i]
          if (typeof item === 'object' && item !== null && 'relationTo' in item) {
            const typedItem = item as Record<string, unknown>

            // Skip if both relationTo and value/id are null/empty
            if (!typedItem.relationTo || (!typedItem.id && !typedItem.value)) {
              continue
            }

            // Transform from {relationTo: 'collection', id: '123'} to {relationTo: 'collection', value: '123'}
            if ('id' in typedItem) {
              typedItem.value = typedItem.id
              delete typedItem.id
            }

            processedArray.push(typedItem)
          } else if (item !== null && item !== undefined) {
            processedArray.push(item)
          }
        }

        // Update the array with filtered results
        if (value.length !== processedArray.length) {
          doc[key] = processedArray.length > 0 ? processedArray : []
        }
      }
      // For non-polymorphic arrays, preserve null placeholders for sparse arrays
    }
    // Handle single polymorphic relationships
    else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check if this is a single polymorphic relationship
      if ('relationTo' in value && ('id' in value || 'value' in value)) {
        const typedValue = value as Record<string, unknown>

        // If both relationTo and value are null/empty, set the whole field to null
        if (!typedValue.relationTo || (!typedValue.id && !typedValue.value)) {
          doc[key] = null
        } else {
          // If it has 'id', transform to 'value'
          if ('id' in typedValue && !('value' in typedValue)) {
            typedValue.value = typedValue.id
            delete typedValue.id
          }
        }
      } else {
        // Recursively process nested objects
        postProcessDocument(value as Record<string, unknown>, fields)
      }
    }
  }

  // Process rich text fields to ensure proper data types
  const richTextFields = fields.filter((field) => field.type === 'richText')
  for (const field of richTextFields) {
    if (field.name in doc && doc[field.name]) {
      doc[field.name] = processRichTextField(doc[field.name])
    }
  }

  // Also process rich text fields in blocks
  const blockFields = fields.filter((field) => field.type === 'blocks')
  for (const field of blockFields) {
    if (field.name in doc && Array.isArray(doc[field.name])) {
      const blocks = doc[field.name] as any[]
      for (const block of blocks) {
        if (!block || typeof block !== 'object') {
          continue
        }

        // Look for richText fields directly in the block
        for (const [key, value] of Object.entries(block)) {
          if (key === 'richText' || (typeof key === 'string' && key.includes('richText'))) {
            block[key] = processRichTextField(value)
          }
        }
      }
    }
  }
}
