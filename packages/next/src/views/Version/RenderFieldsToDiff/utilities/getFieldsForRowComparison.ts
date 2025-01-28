import type {
  ArrayFieldClient,
  BaseVersionField,
  BlocksFieldClient,
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
  field,
  row,
  versionRow,
}: {
  baseVersionField: BaseVersionField
  comparisonRow: any
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
      const matchedBlock = ('blocks' in field &&
        field.blocks?.find((block) => block.slug === versionRow?.blockType)) || {
        fields: [],
      }

      fields = matchedBlock.fields
      versionFields = baseVersionField.rows?.length
        ? baseVersionField.rows[row]
        : baseVersionField.fields
    } else {
      const matchedVersionBlock = ('blocks' in field &&
        field.blocks?.find((block) => block.slug === versionRow?.blockType)) || {
        fields: [],
      }
      const matchedComparisonBlock = ('blocks' in field &&
        field.blocks?.find((block) => block.slug === comparisonRow?.blockType)) || {
        fields: [],
      }

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
