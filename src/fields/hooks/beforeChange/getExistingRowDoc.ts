/**
  * If there is an incoming row id,
  * and it matches the existing sibling doc id,
  * this is an existing row, so it should be merged.
  * Otherwise, return an empty object.
 */

export const getExistingRowDoc = (incomingRow: Record<string, unknown>, existingRow?: Record<string, unknown>): Record<string, unknown> => {
  if (incomingRow.id && incomingRow.id === existingRow?.id) {
    return existingRow;
  }

  return {};
};
