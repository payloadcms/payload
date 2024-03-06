import type { BaseDatabaseAdapter } from '../database/types.d.ts'
import type { Field } from '../fields/config/types.d.ts'

export const getIDType = (
  idField: Field | null,
  defaultIDType: BaseDatabaseAdapter['defaultIDType'] | null,
): 'ObjectID' | 'number' | 'text' => {
  if (idField) {
    return idField.type === 'number' ? 'number' : 'text'
  }
  return defaultIDType || 'ObjectID'
}
