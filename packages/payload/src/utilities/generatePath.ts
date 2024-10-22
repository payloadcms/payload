import type { FieldTypes } from '../fields/config/types.js'

type Args = {
  fieldType: FieldTypes
  name?: string
  parentPath?: string
  schemaIndex?: number | string
}
export function generatePath({ name, fieldType, parentPath = '', schemaIndex }: Args): string {
  let fieldPath = parentPath
  if (name) {
    fieldPath = parentPath ? `${parentPath}.${name}` : name
  }

  if (fieldType === 'collapsible' || fieldType === 'row') {
    fieldPath = `${fieldPath}_index-${schemaIndex}`
  }

  return fieldPath
}
