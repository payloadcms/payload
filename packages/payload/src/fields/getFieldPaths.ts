import type { MarkOptional } from 'ts-essentials'

import type { ClientTab } from '../admin/types.js'
import type { ClientField, Field, Tab, TabAsFieldClient } from './config/types.js'

export type GetFieldPathsArgs = {
  field: ClientField | ClientTab | Field | Tab | TabAsFieldClient
  index: number
} & ParentFieldPaths

/**
 * Like `FieldPaths`, but relative to this field's parent.
 */
export type ParentFieldPaths = {
  /**
   * Like `FieldPaths['indexPath']`, but relative to this field's parent.
   */
  parentIndexPath: string
  /**
   * Like `FieldPaths['path']`, but relative to this field's parent.
   */
  parentPath: string
  /**
   * Like `FieldPaths['schemaPath']`, but relative to this field's parent.
   */
  parentSchemaPath: string
}

/**
 * A group of paths related to this field's position within the:
 *  - Payload Config, via `schemaPath`
 *  - Data object, via `path`
 */
export type FieldPaths = {
  /**
   * A string of '-' separated indexes representing where
   * to find this field in a given field schema array.
   * Used internally to build up the `schemaPath` and `path` for unnamed fields such as tabs.
   */
  indexPath: string
  /**
   * Path to this field relative to its position in a data object:
   * @example
   * ```
   * {
   *   array: [
   *     {
   *       group: {
   *         text: 'value'
   *       }
   *     }
   *   ]
   * }
   * ```
   * The path to `text` field would be `array.[n].group.text`.
   * Note that `[n]` is used to represent the index of the array item, as this is dynamic and can change.
   * This same thing applies to blocks or any other array-represented field.
   */
  path: string
  /**
   * The path for this field relative to its position in the Payload Config.
   * @example
   * ```
   * {
   *   fields: [
   *     {
   *       type: 'tabs',
   *       tabs: [
   *         {
   *           name: 'tab1',
   *           fields: [
   *             {
   *               name: 'group',
   *               fields: [
   *                 {
   *                   name: 'text',
   *                   type: 'text'
   *                 }
   *               ]
   *             }
   *           ]
   *         }
   *       ]
   *     }
   *   ]
   * ```
   * The schemaPath to `text` field would be `_index-0.tab1.group.text`.
   * Note that `_index-0` is used to represent the index of the `tabs` field, as this is an unnamed field.
   * Sequential unnamed fields stack their indexes, so if there was another unnamed field after `tabs`, it would be `_index-0-0`, and so on.
   */
  schemaPath: string
}

export function getFieldPaths({
  field,
  index,
  parentIndexPath,
  parentPath = '',
  parentSchemaPath,
}: MarkOptional<GetFieldPathsArgs, 'parentPath'>): FieldPaths {
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
