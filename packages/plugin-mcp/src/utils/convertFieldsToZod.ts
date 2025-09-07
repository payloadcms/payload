import type { Field } from 'payload'

import { z } from 'zod'

export const convertFieldsToZod = (fields: Field[]) => {
  const zodObject: Record<string, z.ZodTypeAny> = {}

  const convertField = (field: Field): null | z.ZodTypeAny => {
    // Skip fields that don't have names (UI fields, tabs, etc.)
    if (!('name' in field) || !field.name) {
      return null
    }

    // Skip hidden fields - check if admin.hidden is true
    if ('admin' in field && field.admin && 'hidden' in field.admin && field.admin.hidden) {
      return null
    }

    // Skip fields marked as hidden at the top level
    if ('hidden' in field && field.hidden) {
      return null
    }

    let zodType: z.ZodTypeAny

    switch (field.type) {
      case 'array':
        if ('fields' in field && field.fields) {
          const nestedFields = convertFieldsToZod(field.fields)
          let arraySchema = z.array(nestedFields)
          if ('minRows' in field && field.minRows) {
            arraySchema = arraySchema.min(field.minRows)
          }
          if ('maxRows' in field && field.maxRows) {
            arraySchema = arraySchema.max(field.maxRows)
          }
          zodType = arraySchema
        } else {
          zodType = z.array(z.any())
        }
        break
      case 'blocks':
        // Blocks are complex, store as any for now
        zodType = z.array(z.any())
        break
      case 'checkbox':
        zodType = z.boolean()
        break

      case 'code':
      case 'text':
      case 'textarea': {
        let stringSchema = z.string()
        if ('minLength' in field && field.minLength) {
          stringSchema = stringSchema.min(field.minLength)
        }
        if ('maxLength' in field && field.maxLength) {
          stringSchema = stringSchema.max(field.maxLength)
        }
        zodType = stringSchema
        break
      }

      case 'date':
        zodType = z.string().datetime()
        break

      case 'email':
        zodType = z.string().email()
        break

      case 'group':
        if ('fields' in field && field.fields) {
          const nestedFields = convertFieldsToZod(field.fields)
          zodType = nestedFields
        } else {
          zodType = z.object({})
        }
        break

      case 'json':
        zodType = z.record(z.any())
        break

      case 'number': {
        let numberSchema = z.number()
        if ('min' in field && field.min !== undefined) {
          numberSchema = numberSchema.min(field.min)
        }
        if ('max' in field && field.max !== undefined) {
          numberSchema = numberSchema.max(field.max)
        }
        zodType = numberSchema
        break
      }

      case 'point':
        zodType = z.tuple([z.number(), z.number()])
        break

      case 'radio':
        if ('options' in field && field.options) {
          const values = field.options.map((option) =>
            typeof option === 'string' ? option : option.value,
          )
          zodType = z.enum(values as [string, ...string[]])
        } else {
          zodType = z.string()
        }
        break

      case 'relationship':
        // Relationship fields typically store IDs as strings
        zodType = z.string()
        break

      case 'richText':
        // Rich text is typically stored as a complex object or string
        zodType = z.any()
        break

      case 'select':
        if ('options' in field && field.options) {
          const values = field.options.map((option) =>
            typeof option === 'string' ? option : option.value,
          )
          zodType = z.enum(values as [string, ...string[]])
        } else {
          zodType = z.string()
        }
        break

      case 'upload':
        // Upload fields typically store file IDs as strings
        zodType = z.string()
        break

      default:
        // For any unhandled field types, default to string
        zodType = z.string()
        break
    }

    // Handle hasMany fields (for text, number, select, relationship, upload)
    if ('hasMany' in field && field.hasMany) {
      let arraySchema = z.array(zodType)
      if ('minRows' in field && field.minRows) {
        arraySchema = arraySchema.min(field.minRows)
      }
      if ('maxRows' in field && field.maxRows) {
        arraySchema = arraySchema.max(field.maxRows)
      }
      zodType = arraySchema
    }

    // Handle required fields
    if (!('required' in field) || !field.required) {
      zodType = zodType.optional()
    }

    // Handle default values
    if ('defaultValue' in field && field.defaultValue !== undefined) {
      zodType = zodType.default(field.defaultValue)
    }

    // Add description from admin.description if available
    if (
      'admin' in field &&
      field.admin &&
      'description' in field.admin &&
      field.admin.description
    ) {
      const description =
        typeof field.admin.description === 'string'
          ? field.admin.description
          : typeof field.admin.description === 'function'
            ? 'Field description' // fallback for function descriptions
            : 'Field description'
      zodType = zodType.describe(description)
    }

    return zodType
  }

  // Process all fields and build the object
  fields.forEach((field) => {
    const zodType = convertField(field)
    if (zodType && 'name' in field && field.name) {
      zodObject[field.name] = zodType
    }
  })

  return z.object(zodObject)
}
