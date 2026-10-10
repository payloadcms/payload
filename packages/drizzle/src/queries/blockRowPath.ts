/**
 * Block rows are stored on the collection table (`${root}_blocks_${slug}`), not on
 * the array table that contains the field. `_path` stops at the blocks field name;
 * `appendFieldToStoragePath` also appends `.%` for the field itself.
 */
export function blockTableKey(rootTableName: string, blockSlug: string): string {
  return `${rootTableName}_blocks_${blockSlug}`
}

export function blockRowPathPattern(fieldStoragePath: string): string {
  return fieldStoragePath.endsWith('.%') ? fieldStoragePath.slice(0, -2) : fieldStoragePath
}
