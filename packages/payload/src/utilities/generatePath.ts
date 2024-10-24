import type { FieldTypes } from '../fields/config/types.js'

type Args = {
  fieldType: 'tab' | FieldTypes
  name?: string
  parentPath?: string
  schemaIndex?: number | string
}
export function generatePath({ name, fieldType, parentPath = '', schemaIndex }: Args): string {
  let fieldPath = parentPath
  if (name) {
    fieldPath = parentPath ? `${parentPath}.${name}` : name
  }

  if (
    fieldType === 'collapsible' ||
    fieldType === 'row' ||
    fieldType === 'tabs' ||
    (fieldType === 'tab' && !name)
  ) {
    fieldPath = fieldPath?.length ? `${fieldPath}._index-${schemaIndex}` : `_index-${schemaIndex}`
  }

  return fieldPath
}
