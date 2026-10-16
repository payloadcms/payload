import type {
  ArrayFieldClient,
  BaseVersionField,
  BlocksFieldClient,
  ClientConfig,
  ClientField,
  VersionField,
} from 'payload'

/**
 * Get the fields for a row in an iterable field for comparison.
 * - Array fields: the fields of the array field, because the fields are the same for each row.
 * - Blocks fields: the fields of the matching block when the block types are the same.
 *   Replaced blocks intentionally return no shared field list because each block schema must be
 *   compared independently.
 */
export function getFieldsForRowComparison({
  baseVersionField,
  config,
  field,
  row,
  valueFromRow,
  valueToRow,
}: {
  baseVersionField: BaseVersionField
  config: ClientConfig
  field: ArrayFieldClient | BlocksFieldClient
  row: number
  valueFromRow: any
  valueToRow: any
}): { fields: ClientField[]; versionFields: VersionField[] } {
  let fields: ClientField[] = []
  let versionFields: VersionField[] = []

  if (field.type === 'array' && 'fields' in field) {
    fields = field.fields
    versionFields = baseVersionField.rows?.length
      ? baseVersionField.rows[row]
      : baseVersionField.fields
  } else if (field.type === 'blocks') {
    if (valueToRow?.blockType === valueFromRow?.blockType) {
      fields = getBlockFields({
        blockSlug: valueToRow?.blockType,
        config,
        field,
      })
    }

    versionFields = baseVersionField.rows?.length
      ? baseVersionField.rows[row]
      : baseVersionField.fields
  }

  return { fields, versionFields }
}

export function getBlockFields({
  blockSlug,
  config,
  field,
}: {
  blockSlug: string | undefined
  config: ClientConfig
  field: BlocksFieldClient
}): ClientField[] {
  const matchedBlock =
    (blockSlug && config?.blocksMap?.[blockSlug]) ||
    (('blocks' in field || 'blockReferences' in field) &&
      (field.blockReferences ?? field.blocks)?.find(
        (block) => typeof block !== 'string' && block.slug === blockSlug,
      ))

  return typeof matchedBlock === 'string' ? [] : (matchedBlock?.fields ?? [])
}
