/**
 * beforeOperation Hook Responsibilities:
 * - Detect when path fields (_h_slugPath, _h_titlePath) are selected
 * - Auto-include required fields (parent, title, slugField) for ancestor traversal
 * - Track auto-added fields in context so afterRead can strip them from response
 */

import type { BeforeOperationHook } from '../../collections/config/types.js'
import type { CollectionSlug } from '../../index.js'

type Args = {
  /**
   * The name of the field that contains the parent document ID
   */
  parentFieldName: string
  /**
   * Optional dedicated slug field for path generation
   */
  slugFieldName?: string
  /**
   * The name of the field to populate with the slug-based path
   */
  slugPathFieldName: string
  /**
   * The name of the title field (from useAsTitle)
   */
  titleFieldName: string
  /**
   * The name of the field to populate with the title-based path
   */
  titlePathFieldName: string
}

/**
 * Checks if a field is selected in the select object
 */
function isFieldInSelect(select: Record<string, unknown> | undefined, fieldName: string): boolean {
  if (!select) {
    return false
  }
  return select[fieldName] === true
}

/**
 * Checks if path fields are being selected
 */
function isPathFieldSelected(
  select: Record<string, unknown> | undefined,
  slugPathFieldName: string,
  titlePathFieldName: string,
): boolean {
  if (!select) {
    return false
  }
  return isFieldInSelect(select, slugPathFieldName) || isFieldInSelect(select, titlePathFieldName)
}

export const hierarchyCollectionBeforeOperation = <TSlug extends CollectionSlug>({
  parentFieldName,
  slugFieldName,
  slugPathFieldName,
  titleFieldName,
  titlePathFieldName,
}: Args): BeforeOperationHook<TSlug> => {
  return (hookArgs) => {
    const { args, context, operation } = hookArgs

    // Only process read operations that have select
    if (
      operation !== 'find' &&
      operation !== 'findByID' &&
      operation !== 'read' &&
      operation !== 'findDistinct' &&
      operation !== 'readDistinct'
    ) {
      return
    }

    // Type guard - these operations have select in their args
    const operationArgs = args as { select?: Record<string, unknown> }
    const select = operationArgs.select

    // No select means all fields are returned - no augmentation needed
    if (!select || typeof select !== 'object') {
      return
    }

    // Check if path fields are being selected
    if (!isPathFieldSelected(select, slugPathFieldName, titlePathFieldName)) {
      return
    }

    // Track which fields we auto-add so afterRead can strip them
    const autoAddedFields: string[] = []

    // Add parent field if not already selected
    if (!isFieldInSelect(select, parentFieldName)) {
      select[parentFieldName] = true
      autoAddedFields.push(parentFieldName)
    }

    // Add title field if not already selected
    if (!isFieldInSelect(select, titleFieldName)) {
      select[titleFieldName] = true
      autoAddedFields.push(titleFieldName)
    }

    // Add slug field if configured and not already selected
    if (slugFieldName && !isFieldInSelect(select, slugFieldName)) {
      select[slugFieldName] = true
      autoAddedFields.push(slugFieldName)
    }

    // Store auto-added fields in context for afterRead to clean up
    if (autoAddedFields.length > 0) {
      context.hierarchyAutoSelectedFields = autoAddedFields
    }

    // Set flag to trigger path computation in afterRead
    context.computeHierarchyPathsViaSelect = true
  }
}
