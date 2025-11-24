import { dequal } from 'dequal'

import type { AtomicOperations } from '../../types/atomic.js'

import { getObjectDotNotation } from '../getObjectDotNotation.js'

/**
 * Push operation: adds new items, filtering out duplicates
 */
const pushOperation = (currentValue: unknown[], newItems: unknown[]): unknown[] => {
  const itemsToAdd = newItems.filter(
    (newItem) => !currentValue.some((existingItem) => dequal(existingItem, newItem)),
  )
  return [...currentValue, ...itemsToAdd]
}

/**
 * Remove operation: filters out matching items
 */
const removeOperation = (currentValue: unknown[], itemsToRemove: unknown[]): unknown[] => {
  return currentValue.filter(
    (item) => !itemsToRemove.some((removeItem) => dequal(item, removeItem)),
  )
}

/**
 * Apply atomic operations directly to a data object
 *
 * This recursively traverses the operation structure and applies changes directly
 * to the target data object, avoiding intermediate objects and conversions.
 *
 * @param currentDoc - The current document state to read existing values from
 * @param data - The data object to apply changes to (mutated in place)
 * @param operations - The atomic operations to apply ($push and/or $remove)
 */
export const applyAtomicOperations = (
  currentDoc: Record<string, unknown>,
  data: Record<string, unknown>,
  operations: AtomicOperations,
): void => {
  if (operations.$push) {
    applyOperationRecursively(currentDoc, data, operations.$push, pushOperation)
  }

  if (operations.$remove) {
    applyOperationRecursively(currentDoc, data, operations.$remove, removeOperation)
  }
}

/**
 * Recursively apply atomic operations directly to the data object
 */
const applyOperationRecursively = (
  currentDoc: Record<string, unknown>,
  data: Record<string, unknown>,
  operationData: Record<string, unknown>,
  operationFn: (currentValue: unknown[], items: unknown[]) => unknown[],
  path = '',
): void => {
  for (const [fieldName, value] of Object.entries(operationData)) {
    const currentPath = path ? `${path}.${fieldName}` : fieldName

    if (Array.isArray(value)) {
      // This is a leaf field - apply the operation
      const currentValue = getObjectDotNotation(currentDoc, currentPath, [])

      if (!Array.isArray(currentValue)) {
        throw new Error(`Cannot execute atomic operation on non-array field "${currentPath}"`)
      }

      // Apply the operation using the callback function
      const newValue = operationFn(currentValue, value)

      // Apply the change directly to the data object
      ensureNestedPath(data, fieldName)
      data[fieldName] = newValue
    } else if (value && typeof value === 'object') {
      // This is a container field - recurse deeper
      ensureNestedPath(data, fieldName)
      applyOperationRecursively(
        currentDoc,
        data[fieldName] as Record<string, unknown>,
        value as Record<string, unknown>,
        operationFn,
        currentPath,
      )
    }
  }
}

/**
 * Ensure a nested path exists in the data object
 */
const ensureNestedPath = (data: Record<string, unknown>, fieldName: string): void => {
  if (!data[fieldName] || typeof data[fieldName] !== 'object' || Array.isArray(data[fieldName])) {
    data[fieldName] = {}
  }
}
