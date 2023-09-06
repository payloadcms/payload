/* eslint-disable no-param-reassign */
import { Field, fieldAffectsData, TabAsField, tabHasName } from 'payload/dist/fields/config/types';
import toSnakeCase from 'to-snake-case';
import { and, eq } from 'drizzle-orm';
import { APIError } from 'payload/errors';
import flattenFields from 'payload/dist/utilities/flattenTopLevelFields';
import { BuildQueryJoins } from './buildQuery';
import { GenericTable, PostgresAdapter } from '../types';

type TableColumn = {
  table: GenericTable
  columnName: string
  collectionPath: string
}

type Args = {
  adapter: PostgresAdapter,
  collectionPath: string
  columnPrefix?: string
  fields: (Field | TabAsField)[]
  joins: BuildQueryJoins
  locale?: string
  pathSegments: string[]
  tableName: string
  tableColumns?: TableColumn[]
}
/**
 * Transforms path to table and column name
 * Adds tables to `join`
 * @returns TableColumn
 */
export const getTableColumnFromPath = ({
  adapter,
  collectionPath,
  columnPrefix = '',
  fields,
  joins,
  locale,
  pathSegments,
  tableName,
  tableColumns = [],
}: Args): TableColumn[] => {
  const fieldPath = pathSegments[0];
  const field = flattenFields(fields as Field[])
    .find((fieldToFind) => fieldAffectsData(fieldToFind) && fieldToFind.name === fieldPath) as Field | TabAsField;
  let newTableName = tableName;

  if (field) {
    switch (field.type) {
      case 'tabs': {
        tableColumns = tableColumns.concat(getTableColumnFromPath({
          adapter,
          collectionPath,
          columnPrefix,
          fields: field.tabs.map((tab) => ({
            ...tab,
            type: 'tab',
          })),
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
          tableColumns,
        }));
        break;
      }
      case 'tab': {
        if (tabHasName(field)) {
          tableColumns = tableColumns.concat(getTableColumnFromPath({
            adapter,
            collectionPath,
            columnPrefix: `${columnPrefix}${field.name}_`,
            fields: field.fields as Field[],
            joins,
            locale,
            pathSegments: pathSegments.slice(1),
            tableName: newTableName,
          }));
        }
        tableColumns = tableColumns.concat(getTableColumnFromPath({
          adapter,
          collectionPath,
          columnPrefix,
          fields: field.fields as Field[],
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
        }));
        break;
      }

      case 'group': {
        if (field.localized && adapter.payload.config.localization) {
          newTableName = `${tableName}_locales`;
          joins[tableName] = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID);
        }
        tableColumns = tableColumns.concat(getTableColumnFromPath({
          adapter,
          collectionPath,
          columnPrefix: `${columnPrefix}${field.name}_`,
          fields: field.fields as Field[],
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
        }));
        break;
      }

      case 'array': {
        newTableName = `${tableName}_${toSnakeCase(field.name)}`;
        if (field.localized && adapter.payload.config.localization) {
          joins[newTableName] = and(
            eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
            eq(adapter[newTableName]._locale, locale),
          );
        } else {
          joins[newTableName] = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID);
        }
        tableColumns = tableColumns.concat(getTableColumnFromPath({
          adapter,
          collectionPath,
          fields: field.fields as Field[],
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
        }));
        break;
      }

      case 'blocks': {
        // TODO: implement blocks
        throw new Error('not implemented');
      }

      case 'relationship':
      case 'upload': {
        newTableName = `${toSnakeCase(tableName)}_relationships`;
        let relationshipFields;
        if (typeof field.relationTo === 'string') {
          relationshipFields = adapter.payload.collections[field.relationTo];
          if (field.localized && adapter.payload.config.localization) {
            joins[newTableName] = and(
              eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
              eq(adapter[newTableName]._locale, locale),
            );
          } else {
            joins[newTableName] = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID);
          }
        } else {
          throw new APIError('Not supported');
        }
        tableColumns = tableColumns.concat(getTableColumnFromPath({
          adapter,
          collectionPath: pathSegments.slice(1)
            .join('.'),
          fields: relationshipFields as Field[],
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
        }));
        break;
      }

      default: {
        // case 'email':
        // case 'text':
        // case 'number':
        // case 'textarea':
        // case 'checkbox':
        // case 'date':
        // case 'radio':
        // case 'code':
        // case 'json':
        // case 'richText':
        // case 'select':
        // case 'point':
        if (locale && fieldAffectsData(field) && field.localized && adapter.payload.config.localization) {
          newTableName = `${tableName}_locales`;
          joins[newTableName] = and(
            eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
            eq(adapter.tables[newTableName]._locale, locale),
          );
        }
        tableColumns.push({
          collectionPath,
          table: adapter.tables[newTableName],
          columnName: `${columnPrefix}${fieldAffectsData(field) ? field.name : pathSegments[0]}`,
        });
      }
    }
    return tableColumns;
  }

  throw new APIError(`Cannot find field for path at ${fieldPath}`);
};
