import type {
  ArrayFieldClient,
  BaseVersionField,
  BlocksFieldClient,
  ClientBlock,
  ClientConfig,
  ClientField,
  VersionField,
} from 'payload'

import { getUniqueListBy } from 'payload/shared'

/**
 * Get the fields for a row in an iterable field for comparison.
 * - Array fields: the fields of the array field, because the fields are the same for each row.
 * - Blocks fields: the union of fields from the comparison and version row,
 *   because the fields from the version and comparison rows may differ.
 */
export function getFieldsForRowComparison({
  baseVersionField,
  comparisonRow,
  config,
  field,
  row,
  versionRow,
}: {
  baseVersionField: BaseVersionField
  comparisonRow: any
  config: ClientConfig
  field: ArrayFieldClient | BlocksFieldClient
  row: number
  versionRow: any
}): { fields: ClientField[]; versionFields: VersionField[] } {
  let fields: ClientField[] = []
  let versionFields: VersionField[] = []

  if (field.type === 'array' && 'fields' in field) {
    fields = field.fields
    versionFields = baseVersionField.rows?.length
      ? baseVersionField.rows[row]
      : baseVersionField.fields
  } else if (field.type === 'blocks') {
    if (versionRow?.blockType === comparisonRow?.blockType) {
      const matchedBlock: ClientBlock =
        config?.blocksMap?.[versionRow?.blockType] ??
        (((('blocks' in field || 'blockReferences' in field) &&
          (field.blockReferences ?? field.blocks)?.find(
            (block) => typeof block !== 'string' && block.slug === versionRow?.blockType,
          )) || {
          fields: [],
        }) as ClientBlock)

      fields = matchedBlock.fields
      versionFields = baseVersionField.rows?.length
        ? baseVersionField.rows[row]
        : baseVersionField.fields
    } else {
      const matchedVersionBlock =
        config?.blocksMap?.[versionRow?.blockType] ??
        (((('blocks' in field || 'blockReferences' in field) &&
          (field.blockReferences ?? field.blocks)?.find(
            (block) => typeof block !== 'string' && block.slug === versionRow?.blockType,
          )) || {
          fields: [],
        }) as ClientBlock)

      const matchedComparisonBlock =
        config?.blocksMap?.[comparisonRow?.blockType] ??
        (((('blocks' in field || 'blockReferences' in field) &&
          (field.blockReferences ?? field.blocks)?.find(
            (block) => typeof block !== 'string' && block.slug === comparisonRow?.blockType,
          )) || {
          fields: [],
        }) as ClientBlock)

      fields = getUniqueListBy<ClientField>(
        [...matchedVersionBlock.fields, ...matchedComparisonBlock.fields],
        'name',
      )

      // buildVersionFields already merged the fields of the version and comparison rows together
      versionFields = baseVersionField.rows?.length
        ? baseVersionField.rows[row]
        : baseVersionField.fields
    }
  }

  return { fields, versionFields }
}
