import type { ClientField, Field, TabAsField } from './config/types.js'

import { tabHasName } from './config/types.js'

export function getFieldPaths({
  field,
  parentPath = [],
  parentSchemaPath = [],
  schemaIndex,
}: {
  field: ClientField | Field | TabAsField
  parentPath: (number | string)[]
  parentSchemaPath: string[]
  schemaIndex: number
}): {
  path: (number | string)[]
  schemaPath: string[]
} {
  if (field.type === 'tabs' || field.type === 'row' || field.type === 'collapsible') {
    return {
      path: [...parentPath, `_index-${schemaIndex}`],
      schemaPath: [...parentSchemaPath, `_index-${schemaIndex}`],
    }
  } else if (field.type === 'tab') {
    if (tabHasName(field)) {
      return {
        path: [...parentPath, field.name],
        schemaPath: [...parentSchemaPath, field.name],
      }
    } else {
      return {
        path: [...parentPath, `_index-${schemaIndex}`],
        schemaPath: [...parentSchemaPath, `_index-${schemaIndex}`],
      }
    }
  }
  const path = parentPath?.length ? [...parentPath, field.name] : [field.name]
  const schemaPath = parentSchemaPath?.length ? [...parentSchemaPath, field.name] : [field.name]

  return { path, schemaPath }
}
