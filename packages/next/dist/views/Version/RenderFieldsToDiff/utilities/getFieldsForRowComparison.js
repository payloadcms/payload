import { getUniqueListBy } from 'payload/shared';
/**
 * Get the fields for a row in an iterable field for comparison.
 * - Array fields: the fields of the array field, because the fields are the same for each row.
 * - Blocks fields: the union of fields from the comparison and version row,
 *   because the fields from the version and comparison rows may differ.
 */
export function getFieldsForRowComparison({
  baseVersionField,
  config,
  field,
  row,
  valueFromRow,
  valueToRow
}) {
  let fields = [];
  let versionFields = [];
  if (field.type === 'array' && 'fields' in field) {
    fields = field.fields;
    versionFields = baseVersionField.rows?.length ? baseVersionField.rows[row] : baseVersionField.fields;
  } else if (field.type === 'blocks') {
    if (valueToRow?.blockType === valueFromRow?.blockType) {
      const matchedBlock = config?.blocksMap?.[valueToRow?.blockType] ?? (('blocks' in field || 'blockReferences' in field) && (field.blockReferences ?? field.blocks)?.find(block => typeof block !== 'string' && block.slug === valueToRow?.blockType) || {
        fields: []
      });
      fields = matchedBlock.fields;
      versionFields = baseVersionField.rows?.length ? baseVersionField.rows[row] : baseVersionField.fields;
    } else {
      const matchedVersionBlock = config?.blocksMap?.[valueToRow?.blockType] ?? (('blocks' in field || 'blockReferences' in field) && (field.blockReferences ?? field.blocks)?.find(block => typeof block !== 'string' && block.slug === valueToRow?.blockType) || {
        fields: []
      });
      const matchedComparisonBlock = config?.blocksMap?.[valueFromRow?.blockType] ?? (('blocks' in field || 'blockReferences' in field) && (field.blockReferences ?? field.blocks)?.find(block => typeof block !== 'string' && block.slug === valueFromRow?.blockType) || {
        fields: []
      });
      fields = getUniqueListBy([...matchedVersionBlock.fields, ...matchedComparisonBlock.fields], 'name');
      // buildVersionFields already merged the fields of the version and comparison rows together
      versionFields = baseVersionField.rows?.length ? baseVersionField.rows[row] : baseVersionField.fields;
    }
  }
  return {
    fields,
    versionFields
  };
}
//# sourceMappingURL=getFieldsForRowComparison.js.map