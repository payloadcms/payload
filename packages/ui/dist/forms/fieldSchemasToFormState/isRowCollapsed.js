export function isRowCollapsed({
  collapsedPrefs,
  field,
  previousRow,
  row
}) {
  if (previousRow && 'collapsed' in previousRow) {
    return previousRow.collapsed ?? false;
  }
  // If previousFormState is `undefined`, check preferences
  if (collapsedPrefs !== undefined) {
    return collapsedPrefs.includes(row.id) // Check if collapsed in preferences
    ;
  }
  // If neither exists, fallback to `field.admin.initCollapsed`
  return field.admin.initCollapsed;
}
//# sourceMappingURL=isRowCollapsed.js.map