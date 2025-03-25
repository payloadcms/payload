import type { ClientField, Field, Tab, TabAsFieldClient } from 'payload'

type Args = {
  field: ClientField | Field | Tab | TabAsFieldClient
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

export function getFieldPathsModified({
  field,
  index,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
}: Args): FieldPaths {
  const parentPathSegments = parentPath.split('.')

  const parentIsUnnamed = parentPathSegments[parentPathSegments.length - 1].startsWith('_index-')

  const parentWithoutIndex = parentIsUnnamed
    ? parentPathSegments.slice(0, -1).join('.')
    : parentPath

  const parentPathToUse = parentIsUnnamed ? parentWithoutIndex : parentPath

  if ('name' in field) {
    return {
      indexPath: '',
      path: `${parentPathToUse ? parentPathToUse + '.' : ''}${field.name}`,
      schemaPath: `${parentSchemaPath ? parentSchemaPath + '.' : ''}${field.name}`,
    }
  }

  const indexSuffix = `_index-${`${parentIndexPath ? parentIndexPath + '-' : ''}${index}`}`

  return {
    indexPath: `${parentIndexPath ? parentIndexPath + '-' : ''}${index}`,
    path: `${parentPathToUse ? parentPathToUse + '.' : ''}${indexSuffix}`,
    schemaPath: `${!parentIsUnnamed && parentSchemaPath ? parentSchemaPath + '.' : ''}${indexSuffix}`,
  }
}
