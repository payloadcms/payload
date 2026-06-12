import type { FlattenedField } from 'payload'

import { getBlockFlattenedFields, getNestedFlattenedFields } from './flattenedFields.js'
import { isPlainObject } from './isPlainObject.js'
import { processRichTextField } from './processRichTextField.js'

const normalizeLocalizedFields = (doc: Record<string, unknown>, fields: FlattenedField[]): void => {
  const processed = new Set<string>()

  for (const field of fields.filter((f) => f.localized)) {
    if (processed.has(field.name)) {
      continue
    }

    const localePattern = new RegExp(`^${field.name}_([a-z]{2}(?:_[A-Z]{2})?)$`)
    const localeData: Record<string, unknown> = {}
    const keysToDelete: string[] = []

    for (const [key, value] of Object.entries(doc)) {
      const match = key.match(localePattern)
      if (match && match[1]) {
        localeData[match[1]] = value
        keysToDelete.push(key)
      }
    }

    if (Object.keys(localeData).length > 0) {
      doc[field.name] = localeData
      keysToDelete.forEach((key) => delete doc[key])
      processed.add(field.name)
    }
  }
}

const normalizeHasManyNumbers = (doc: Record<string, unknown>, fields: FlattenedField[]): void => {
  const numberFields = fields.filter((field) => field.type === 'number' && field.hasMany)
  for (const field of numberFields) {
    if (!(field.name in doc)) {
      continue
    }
    const value = doc[field.name]

    if (typeof value === 'string' && value.includes(',')) {
      doc[field.name] = value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v !== '')
        .map((v) => {
          const num = parseFloat(v)
          return isNaN(num) ? 0 : num
        })
    } else if (Array.isArray(value)) {
      doc[field.name] = value
        .filter((v) => v !== null && v !== undefined && v !== '')
        .map((v) => {
          if (typeof v === 'string') {
            const num = parseFloat(v)
            return isNaN(num) ? 0 : num
          }
          return v
        })
    } else if (value !== null && value !== undefined && value !== '') {
      const num = typeof value === 'string' ? parseFloat(value) : value
      doc[field.name] = isNaN(num as number) ? [] : [num]
    } else {
      doc[field.name] = []
    }
  }
}

const normalizeHasManyRelationships = (
  doc: Record<string, unknown>,
  fields: FlattenedField[],
): void => {
  const relationshipFields = fields.filter(
    (field) =>
      (field.type === 'relationship' || field.type === 'upload') &&
      field.hasMany === true &&
      !Array.isArray(field.relationTo),
  )

  for (const field of relationshipFields) {
    const value = doc[field.name]

    if (typeof value === 'string' && value.includes(',')) {
      doc[field.name] = value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v !== '')
    } else if (Array.isArray(value)) {
      doc[field.name] = value.filter((v) => v !== null && v !== undefined && v !== '')
    } else if (value !== null && value !== undefined && value !== '') {
      doc[field.name] = [value]
    }
  }
}

const normalizePolymorphicRelationships = (
  doc: Record<string, unknown>,
  fields: FlattenedField[],
): void => {
  for (const [key, value] of Object.entries(doc)) {
    if (Array.isArray(value)) {
      const hasPolymorphicItems = value.some((item) => isPlainObject(item) && 'relationTo' in item)

      if (!hasPolymorphicItems) {
        continue
      }

      const processedArray: unknown[] = []
      for (const item of value) {
        if (isPlainObject(item) && 'relationTo' in item) {
          if (!item.relationTo || (!item.id && !item.value)) {
            continue
          }
          if ('id' in item) {
            item.value = item.id
            delete item.id
          }
          processedArray.push(item)
        } else if (item !== null && item !== undefined) {
          processedArray.push(item)
        }
      }

      if (value.length !== processedArray.length) {
        doc[key] = processedArray.length > 0 ? processedArray : []
      }
    } else if (isPlainObject(value)) {
      if ('relationTo' in value && ('id' in value || 'value' in value)) {
        if (!value.relationTo || (!value.id && !value.value)) {
          doc[key] = null
        } else if ('id' in value && !('value' in value)) {
          value.value = value.id
          delete value.id
        }
      } else {
        normalizePolymorphicRelationships(value, fields)
      }
    }
  }
}

const normalizeRichTextInFields = (
  doc: Record<string, unknown>,
  fields: FlattenedField[],
): void => {
  for (const field of fields) {
    if (!('name' in field) || !field.name || !(field.name in doc)) {
      continue
    }
    const value = doc[field.name]
    if (value === null || value === undefined) {
      continue
    }

    if (field.type === 'richText') {
      doc[field.name] = processRichTextField(value)
    } else if (field.type === 'blocks') {
      if (!Array.isArray(value)) {
        continue
      }
      const blockDefs =
        (field as { blocks?: Array<{ flattenedFields?: FlattenedField[]; slug: string }> })
          .blocks ?? []
      for (const blockItem of value) {
        if (!isPlainObject(blockItem)) {
          continue
        }
        const blockDef = blockDefs.find((b) => b.slug === blockItem.blockType)
        if (blockDef) {
          normalizeRichTextInFields(blockItem, getBlockFlattenedFields(blockDef))
        }
      }
    } else if (field.type === 'array') {
      if (!Array.isArray(value)) {
        continue
      }
      const nestedFields = getNestedFlattenedFields(field) ?? []
      for (const item of value) {
        if (!isPlainObject(item)) {
          continue
        }
        normalizeRichTextInFields(item, nestedFields)
      }
    } else if (field.type === 'group' || field.type === 'tab') {
      if (!isPlainObject(value)) {
        continue
      }
      const nestedFields = getNestedFlattenedFields(field) ?? []
      normalizeRichTextInFields(value, nestedFields)
    }
  }
}

const normalizeRichText = (doc: Record<string, unknown>, fields: FlattenedField[]): void => {
  normalizeRichTextInFields(doc, fields)
}

/**
 * Post-processes the unflattened document to handle special field types:
 * - Localized fields: transforms field_locale keys to nested { field: { locale: value } }
 * - Number hasMany: converts comma-separated strings or arrays to number arrays
 * - Relationship hasMany: converts comma-separated IDs to arrays
 * - Polymorphic relationships: transforms flat {relationTo, id} to {relationTo, value}
 * - Rich text fields: ensures proper data structure
 */
export const postProcessDocument = (
  doc: Record<string, unknown>,
  fields: FlattenedField[],
): void => {
  normalizeLocalizedFields(doc, fields)
  normalizeHasManyNumbers(doc, fields)
  normalizeHasManyRelationships(doc, fields)
  normalizePolymorphicRelationships(doc, fields)
  normalizeRichText(doc, fields)
}
