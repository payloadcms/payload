import type { FlattenedField, PayloadRequest } from 'payload'

import type { ImportFieldHookEntry } from '../types.js'

import { getNestedFlattenedFields } from './flattenedFields.js'
import { postProcessDocument } from './unflattenPostProcess.js'

type UnflattenArgs = {
  data: Record<string, unknown>
  fields: FlattenedField[]
  format?: 'csv' | 'json' | ({} & string)
  importFieldHooks?: Record<string, ImportFieldHookEntry>
  req: PayloadRequest
}

const indexSegment = /^\d+$/

const collectArrayLikeNames = (fields: FlattenedField[], into: Set<string>): void => {
  for (const field of fields) {
    if (!('name' in field) || !field.name) {
      continue
    }
    if (field.type === 'array' || field.type === 'blocks') {
      into.add(field.name)
    }
    const nested = getNestedFlattenedFields(field)
    if (nested) {
      collectArrayLikeNames(nested, into)
    }
  }
}

/**
 * Drops numeric array-index segments from a flat key so a runtime key like
 * `items_0_note` matches the static, index-free key a user hook is registered
 * under. A digit-only segment is only stripped when the segment immediately
 * before it names an array or blocks field, so a literal field name like
 * `2024` is preserved.
 */
const toLogicalKey = (flatKey: string, arrayLikeNames: Set<string>): string => {
  const segments = flatKey.split('_')
  return segments
    .filter((seg, i) => !indexSegment.test(seg) || !arrayLikeNames.has(segments[i - 1] ?? ''))
    .join('_')
}

/**
 * Converts flattened CSV data back into a nested document structure.
 *
 * The algorithm:
 * 1. Sorts keys to ensure array indices are processed in order
 * 2. For each flattened key (e.g., "blocks_0_hero_title"), splits by underscore into path segments
 * 3. Traverses/builds the nested structure, handling:
 *    - Arrays (numeric segments like "0", "1")
 *    - Blocks (blockType detection from slug patterns)
 *    - Polymorphic relationships (_relationTo and _id suffix pairs)
 *    - Regular nested objects
 * 4. Post-processes to handle localized fields, hasMany conversions, and relationship transforms
 */
export const unflattenObject = ({
  data,
  fields,
  format = 'csv',
  importFieldHooks = {},
  req,
}: UnflattenArgs): Record<string, unknown> => {
  if (!data || typeof data !== 'object') {
    return {}
  }

  const result: Record<string, unknown> = {}

  const arrayLikeNames = new Set<string>()
  collectArrayLikeNames(fields, arrayLikeNames)

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

    // Preserve system fields with underscore prefix (like _status) without splitting
    if (flatKey === '_status') {
      result[flatKey] = value
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
        if (baseKey in result) {
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

    const importHookEntry =
      importFieldHooks[flatKey] ?? importFieldHooks[toLogicalKey(flatKey, arrayLikeNames)]
    if (importHookEntry) {
      try {
        value = importHookEntry.fn({
          columnName: flatKey,
          data,
          format,
          siblingData: data,
          siblingDoc: data,
          value,
        })
      } catch (error) {
        req.payload.logger.error({
          err: error,
          msg: `[plugin-import-export] Field-level beforeImport hook for "${flatKey}" threw — falling back to original value`,
        })
        // Keep the original value so the row is not dropped — downstream
        // validation will surface any deeper issue per-row.
      }
    }

    // Example: "blocks_0_content_text" -> ["blocks", "0", "content", "text"]
    const pathSegments = flatKey.split('_')
    let currentObject: Record<string, unknown> = result

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      if (!segment) {
        continue
      } // Skip empty segments

      const nextSegment = pathSegments[i + 1]
      const isLast = i === pathSegments.length - 1

      // Check if next segment is a numeric array index (e.g., "0", "1", "2")
      const isArrayIndex = nextSegment !== undefined && /^\d+$/.test(nextSegment)

      if (isLast) {
        // Special handling for blockType suffix in blocks
        if (segment === 'blockType' && i >= 3) {
          // Pattern: blocks_0_hero_blockType -> set blockType on the block
          const blockFieldName = pathSegments[0] // 'blocks'
          const isBlockField = fields.some(
            (field) => field.name === blockFieldName && field.type === 'blocks',
          )

          if (isBlockField && pathSegments[1]?.match(/^\d+$/)) {
            const parent = getParentObject(result, pathSegments.slice(0, 2))
            if (parent && typeof parent === 'object') {
              parent.blockType = value
            }
            continue
          }
        }

        // Special handling for relationship fields with _id suffix
        if (segment === 'id' && i > 0) {
          const parentKey = pathSegments[i - 1]
          const isPreviousSegmentArrayIndex = parentKey ? /^\d+$/.test(parentKey) : false

          if (!isPreviousSegmentArrayIndex) {
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
                const relationToKey = pathSegments.slice(0, i).concat('relationTo').join('_')
                const relationToValue = data[relationToKey]

                const parent = getParentObject(result, pathSegments.slice(0, i - 1))
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
                const parent = getParentObject(result, pathSegments.slice(0, i - 1))
                if (parent && parentKey && typeof parent === 'object') {
                  parent[parentKey] = value
                }
                continue
              }
            }
          }
        }

        // _relationTo suffix is handled when processing the _id field above
        if (segment === 'relationTo' && i > 0) {
          const parentKey = pathSegments[i - 1]
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

        currentObject[segment] = value
      } else if (isArrayIndex && nextSegment !== undefined) {
        if (!currentObject[segment] || !Array.isArray(currentObject[segment])) {
          currentObject[segment] = []
        }

        const arrayIndex = parseInt(nextSegment)
        const arr = currentObject[segment] as unknown[]

        // Ensure array has sufficient length
        while (arr.length <= arrayIndex) {
          arr.push(null)
        }

        // Handle array of objects
        if (arr[arrayIndex] === null || arr[arrayIndex] === undefined) {
          arr[arrayIndex] = {}
        }

        // Handle blocks field with block slug pattern (e.g., blocks_0_hero_title)
        const isBlocksField = fields.some((f) => f.name === segment && f.type === 'blocks')
        if (isBlocksField && i + 3 < pathSegments.length) {
          const blockSlug = pathSegments[i + 2]
          const blockFieldName = pathSegments[i + 3]

          if (blockSlug && blockFieldName) {
            const blockObject = arr[arrayIndex] as Record<string, unknown>
            blockObject.blockType = blockSlug

            if (i + 3 === pathSegments.length - 1) {
              blockObject[blockFieldName] = value
            } else {
              if (!blockObject[blockFieldName] || typeof blockObject[blockFieldName] !== 'object') {
                blockObject[blockFieldName] = {}
              }
              currentObject = blockObject[blockFieldName] as Record<string, unknown>
              i = i + 3
              continue
            }
            break
          }
        }

        if (i + 2 === pathSegments.length - 1) {
          const lastSegment = pathSegments[pathSegments.length - 1]
          if (lastSegment && arr[arrayIndex] && typeof arr[arrayIndex] === 'object') {
            ;(arr[arrayIndex] as Record<string, unknown>)[lastSegment] = value
          }
          break
        } else if (i + 1 === pathSegments.length - 1) {
          // Direct array value (e.g., tags_0 = "value")
          arr[arrayIndex] = value
          break
        } else {
          currentObject = arr[arrayIndex] as Record<string, unknown>
          i++
        }
      } else {
        // Skip if already set to null (polymorphic relationship already processed)
        if (currentObject[segment] === null && isLast && segment === 'relationTo') {
          continue
        }

        if (
          !currentObject[segment] ||
          typeof currentObject[segment] !== 'object' ||
          Array.isArray(currentObject[segment])
        ) {
          currentObject[segment] = {}
        }

        // Handle polymorphic relationship arrays
        if (segment === 'relationTo' && i > 0 && pathSegments[i - 1]?.match(/^\d+$/)) {
          currentObject[segment] = value
        } else if (
          typeof currentObject[segment] === 'object' &&
          !Array.isArray(currentObject[segment]) &&
          currentObject[segment] !== null
        ) {
          currentObject = currentObject[segment] as Record<string, unknown>
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
