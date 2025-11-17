import { status as httpStatus } from 'http-status'

import type { FlattenedField } from '../../fields/config/types.js'
import type { AtomicOperations } from '../../types/atomic.js'

import { APIError } from '../../errors/index.js'

/**
 * Get leaf field paths from an object recursively (only final fields, not containers)
 */
const getFieldPaths = (obj: Record<string, unknown>, prefix = ''): string[] => {
  const paths: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...getFieldPaths(value as Record<string, unknown>, currentPath))
    } else {
      // Only add leaf fields (non-object values) to avoid container conflicts
      paths.push(currentPath)
    }
  }

  return paths
}

/**
 * Detect conflicts between nested data fields and atomic operations
 * Only flags conflicts when the exact same field path is being modified
 */
const detectNestedFieldConflicts = (
  data: Record<string, unknown>,
  operations: AtomicOperations,
): string[] => {
  const dataFields = getFieldPaths(data)
  const operationFields: string[] = []

  if (operations.$push) {
    operationFields.push(...getFieldPaths(operations.$push))
  }
  if (operations.$remove) {
    operationFields.push(...getFieldPaths(operations.$remove))
  }

  return dataFields.filter((field) => operationFields.includes(field))
}

/**
 * Validate atomic operations recursively against field schema
 */
const validateRecursive = (
  data: Record<string, unknown>,
  fields: FlattenedField[],
  path = '',
): string[] => {
  const errors: string[] = []

  for (const [fieldName, value] of Object.entries(data)) {
    const currentPath = path ? `${path}.${fieldName}` : fieldName
    const field = fields.find((f) => f.name === fieldName)

    if (!field) {
      errors.push(`Field "${currentPath}" not found in schema`)
      continue
    }

    if (Array.isArray(value)) {
      if (!(field.type === 'relationship' && field.hasMany === true)) {
        errors.push(
          `Field "${currentPath}" of type "${field.type}" does not support atomic operations`,
        )
      }
    } else if (value && typeof value === 'object') {
      if (field.type === 'group' || field.type === 'tab') {
        errors.push(
          ...validateRecursive(
            value as Record<string, unknown>,
            field.flattenedFields,
            currentPath,
          ),
        )
      } else {
        errors.push(
          `Field "${currentPath}" of type "${field.type}" does not support nested atomic operations`,
        )
      }
    } else {
      errors.push(
        `Invalid value for atomic operation at "${currentPath}": expected array or nested object`,
      )
    }
  }

  return errors
}

/**
 * Validate atomic operations against field schema and check for data conflicts
 * This is the main validation function that should be called before applying operations
 */
export const validateAtomicOperations = (
  operations: AtomicOperations | undefined,
  data: Record<string, unknown> | undefined,
  fields: FlattenedField[],
): void => {
  if (!operations) {
    return
  }

  // Validate atomic operations against field schema
  const schemaErrors: string[] = []

  if (operations.$push) {
    schemaErrors.push(...validateRecursive(operations.$push, fields))
  }
  if (operations.$remove) {
    schemaErrors.push(...validateRecursive(operations.$remove, fields))
  }

  if (schemaErrors.length > 0) {
    throw new APIError(
      `Invalid atomic operations: ${schemaErrors.join(', ')}`,
      httpStatus.BAD_REQUEST,
    )
  }

  // Check for conflicts between data and operations
  if (data) {
    const conflicts = detectNestedFieldConflicts(data, operations)
    if (conflicts.length > 0) {
      throw new APIError(
        `Field conflicts detected between data and operations: ${conflicts.join(', ')}`,
        httpStatus.BAD_REQUEST,
      )
    }
  }
}
