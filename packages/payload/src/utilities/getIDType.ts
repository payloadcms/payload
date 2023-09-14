import type { Field } from '../fields/config/types'

export const getIDType = (idField: Field | null): 'ObjectID' | 'number' | 'text' => {
  if (idField) {
    return idField.type === 'number' ? 'number' : 'text'
  }
  return 'ObjectID'
}
