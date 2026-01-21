import type { ClientTab } from '../admin/types.js'
import type { ClientField, Field, Tab, TabAsFieldClient } from './config/types.js'

export type GetFieldPathsArgs = {
  field: ClientField | ClientTab | Field | Tab | TabAsFieldClient
  index: number
} & ParentFieldPaths

export type ParentFieldPaths = {
  /**
   * Like `indexPath`, but relative to this field's parent.
   */
  parentIndexPath: string
  /**
   * Like `path`, but relative to this field's parent.
   */
  parentPath?: string
  /**
   * Like `schemaPath`, but relative to this field's parent.
   */
  parentSchemaPath: string
}

/**
 * A group of paths related to a field's position within the schema and data.
 */
export type FieldPaths = {
  /**
   * A string of '-' separated indexes representing where
   * to find this field in a given field schema array.
   */
  indexPath: string
  /**
   * Path for this field relative to its position in the data.
   * Arrays and block rows will be represented by their indexes.
   * @example path: 'array.0.group.text'
   */
  path: string
  /**
   * The path for this field relative to its position in the Payload config.
   * Unnamed fields such as tabs will use `_index-` prefixes to represent their position.
   * @example schemaPath: '_index-0-0.text'
   * This translates an unnamed field in the first position (e.g. tabs) > another unnamed field in the first position (e.g. tab) > text field.
   */
  schemaPath: string
}

export function getFieldPaths({
  field,
  index,
  parentIndexPath,
  parentPath = '',
  parentSchemaPath,
}: GetFieldPathsArgs): FieldPaths {
  const parentPathSegments = parentPath.split('.')

  const parentPathIsUnnamed =
    parentPathSegments?.[parentPathSegments.length - 1]?.startsWith('_index-')

  const parentWithoutIndex = parentPathIsUnnamed
    ? parentPathSegments.slice(0, -1).join('.')
    : parentPath

  const parentPathToUse = parentPathIsUnnamed ? parentWithoutIndex : parentPath

  if ('name' in field) {
    return {
      indexPath: '',
      path: `${parentPathToUse ? parentPathToUse + '.' : ''}${field.name}`,
      schemaPath: `${parentSchemaPath ? parentSchemaPath + '.' : ''}${field.name}`,
    }
  }

  const indexSuffix = `_index-${`${parentIndexPath ? parentIndexPath + '-' : ''}${index}`}`

  const parentSchemaPathSegments = parentSchemaPath.split('.')

  const parentSchemaPathIsUnnamed =
    parentSchemaPathSegments?.[parentSchemaPathSegments.length - 1]?.startsWith('_index-')

  return {
    indexPath: `${parentIndexPath ? parentIndexPath + '-' : ''}${index}`,
    path: `${parentPathToUse ? parentPathToUse + '.' : ''}${indexSuffix}`,
    schemaPath: parentSchemaPathIsUnnamed
      ? `${parentSchemaPath}-${index}`
      : `${parentSchemaPath ? parentSchemaPath + '.' : ''}${indexSuffix}`,
  }
}
