import type { Field, TabAsField } from './config/types.js'

import { tabHasName } from './config/types.js'

export function getFieldPaths({
  field,
  parentPath,
  parentSchemaPath,
}: {
  field: Field | TabAsField
  parentPath: (number | string)[]
  parentSchemaPath: string[]
}): {
  path: (number | string)[]
  schemaPath: string[]
} {
  if (field.type === 'tabs' || field.type === 'row' || field.type === 'collapsible') {
    return {
      path: parentPath,
      schemaPath: parentSchemaPath,
    }
  } else if (field.type === 'tab') {
    if (tabHasName(field)) {
      return {
        path: [...parentPath, field.name],
        schemaPath: [...parentSchemaPath, field.name],
      }
    } else {
      return {
        path: parentPath,
        schemaPath: parentSchemaPath,
      }
    }
  }
  const path = parentPath?.length ? [...parentPath, field.name] : [field.name]
  const schemaPath = parentSchemaPath?.length ? [...parentSchemaPath, field.name] : [field.name]

  return { path, schemaPath }
}
