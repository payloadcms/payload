import type { ClientField, Field, TabAsField } from './config/types.js'

import { fieldAffectsData } from './config/types.js'

type Args = {
  field: ClientField | Field | TabAsField
  index: number
  parentIndexPath: string
  parentPath: string
  parentSchemaPath: string
}

type Result = {
  /**
   * A string of '-' separated indexes representing where
   * to find this field in a given field schema array.
   * It will always be complete and accurate.
   */
  indexPath: string
  /**
   * Path for this field specifically.
   */
  path: string
  /**
   * Schema path for this field specifically.
   */
  schemaPath: string
}

export function getFieldPaths({
  field,
  index,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
}: Args): Result {
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
