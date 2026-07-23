/**
 * Virtual strategy beforeOperation hook.
 *
 * Responsibilities:
 * - Detect select requests for virtual path fields
 * - Auto-select required traversal fields (parent/title/slugField)
 * - Mark auto-added fields for afterRead cleanup
 */

import type { BeforeOperationHook } from '../../../collections/config/types.js'
import type { CollectionSlug } from '../../../index.js'

import { isFieldInSelect, isPathFieldSelectedFromSelect } from './utils/pathFieldSelection.js'

type Args = {
  parentFieldName: string
  slugFieldName?: string
  slugPathFieldName: string
  titleFieldName: string
  titlePathFieldName: string
}

export const collectionBeforeOperationVirtual = <TSlug extends CollectionSlug>({
  parentFieldName,
  slugFieldName,
  slugPathFieldName,
  titleFieldName,
  titlePathFieldName,
}: Args): BeforeOperationHook<TSlug> => {
  return (hookArgs) => {
    const { args, context, operation } = hookArgs

    if (
      operation !== 'find' &&
      operation !== 'findByID' &&
      operation !== 'read' &&
      operation !== 'findDistinct' &&
      operation !== 'readDistinct'
    ) {
      return
    }

    const operationArgs = args as { select?: Record<string, unknown> }
    const select = operationArgs.select

    if (!select || typeof select !== 'object') {
      return
    }

    if (!isPathFieldSelectedFromSelect({ select, slugPathFieldName, titlePathFieldName })) {
      return
    }

    const autoAddedFields: string[] = []

    if (!isFieldInSelect(select, parentFieldName)) {
      select[parentFieldName] = true
      autoAddedFields.push(parentFieldName)
    }

    if (!isFieldInSelect(select, titleFieldName)) {
      select[titleFieldName] = true
      autoAddedFields.push(titleFieldName)
    }

    if (slugFieldName && !isFieldInSelect(select, slugFieldName)) {
      select[slugFieldName] = true
      autoAddedFields.push(slugFieldName)
    }

    if (autoAddedFields.length > 0) {
      context.hierarchyAutoSelectedFields = autoAddedFields
    }

    context.computeHierarchyPathsViaSelect = true
  }
}
