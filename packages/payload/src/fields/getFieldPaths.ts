import type { ClientField, Field, Tab, TabAsField, TabAsFieldClient } from './config/types.js'

type Args = {
  field: ClientField | Field | TabAsField | TabAsFieldClient
  index: number
  parentIndexPath: string
  parentPath: string
  parentSchemaPath: string
}

type FieldPaths = {
  /**
   * A string of '-' separated indexes representing where
   * to find this field in a given field schema array.
   * It will always be complete and accurate.
   */
  indexPath: string
  /**
   * Path for this field relative to its position in the data.
   */
  path: string
  /**
   * Path for this field relative to its position in the schema.
   */
  schemaPath: string
}

export function getFieldPaths({
  field,
  index,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
}: Args): FieldPaths {
  if ('name' in field) {
    return {
      indexPath: `${parentIndexPath ? parentIndexPath + '-' : ''}${index}`,
      path: `${parentPath ? parentPath + '.' : ''}${field.name}`,
      schemaPath: `${parentSchemaPath ? parentSchemaPath + '.' : ''}${field.name}`,
    }
  }

  const indexSuffix = `_index-${`${parentIndexPath ? parentIndexPath + '-' : ''}${index}`}`

  return {
    indexPath: `${parentIndexPath ? parentIndexPath + '-' : ''}${index}`,
    path: `${parentPath ? parentPath + '.' : ''}${indexSuffix}`,
    schemaPath: `${parentSchemaPath ? parentSchemaPath + '.' : ''}${indexSuffix}`,
  }
}

export function getTabPaths({
  index,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
  tab,
}: {
  index: number
  parentIndexPath: string
  parentPath: string
  parentSchemaPath: string
  tab: Tab
}): FieldPaths {
  const indexSuffix = `_index-${`${parentIndexPath ? parentIndexPath + '-' : ''}${index}`}`

  return {
    indexPath: [parentIndexPath, index].filter(Boolean).join('-'),
    path: [parentPath, 'name' in tab && tab.name].filter(Boolean).join('.'),
    schemaPath: [parentSchemaPath, indexSuffix].filter(Boolean).join('.'),
  }
}
