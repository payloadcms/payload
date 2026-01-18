export function isColumnActive({
  accessor,
  activeColumnsIndices,
  column,
  columns
}) {
  if (column) {
    return column.active;
  } else if (columns && Array.isArray(columns) && columns.length > 0) {
    return Boolean(columns.find(col => col.accessor === accessor)?.active);
  } else if (activeColumnsIndices.length < 4) {
    return true;
  }
  return false;
}
//# sourceMappingURL=isColumnActive.js.map