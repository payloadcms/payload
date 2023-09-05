/* eslint-disable no-param-reassign */
import { Field, FieldAffectingData, fieldAffectsData, tabHasName } from 'payload/dist/fields/config/types';
import toSnakeCase from 'to-snake-case';
import flattenFields from 'payload/dist/utilities/flattenTopLevelFields';
import { and, eq } from 'drizzle-orm';
import { APIError } from 'payload/errors';
import { BuildQueryJoins } from './buildQuery';
import { GenericTable, PostgresAdapter } from '../types';

type TableColumn = {
  table: GenericTable
  columnName: string
}

type Args = {
  adapter: PostgresAdapter,
  columnPrefix?: string
  fields?: Field[]
  joins: BuildQueryJoins
  locale?: string
  path: string
  tableName: string
}
/**
 * Transforms path to table and column name
 * Adds tables to `join`
 * @returns TableColumn
 */
export const getTableColumnFromPath = ({
  adapter,
  columnPrefix = '',
  fields,
  joins,
  locale,
  path: incomingPath,
  tableName,
}: Args): TableColumn => {
  const pathSegments = incomingPath.split('.');
  const fieldPath = pathSegments[0];
  const field = fields.find((fieldToFind) => fieldAffectsData(fieldToFind) && fieldToFind.name === fieldPath) as FieldAffectingData;
  let newTableName = tableName;

  if (field) {
    if (pathSegments.length === 1) {
      return {
        table: adapter.tables[tableName],
        columnName: incomingPath,
      };
    }
    switch (field.type) {
      case 'tab':
        if (tabHasName(field)) {
          return getTableColumnFromPath({
            adapter,
            columnPrefix: `${columnPrefix}${toSnakeCase(field.name)}_`,
            fields: flattenFields(field.fields) as Field[],
            joins,
            locale,
            path: pathSegments.slice(1).join('.'),
            tableName: newTableName,
          });
        }
        return getTableColumnFromPath({
          adapter,
          columnPrefix,
          fields: flattenFields(field.fields) as Field[],
          joins,
          locale,
          path: pathSegments.slice(1).join('.'),
          tableName: newTableName,
        });


      case 'group': {
        if (field.localized) {
          newTableName = `${tableName}_locales`;
          joins[tableName] = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID);
        }
        return getTableColumnFromPath({
          adapter,
          columnPrefix: `${columnPrefix}${toSnakeCase(field.name)}_`,
          fields: flattenFields(field.fields) as Field[],
          joins,
          locale,
          path: pathSegments.slice(1).join('.'),
          tableName: newTableName,
        });
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
        return getTableColumnFromPath({
          adapter,
          fields: flattenFields(field.fields) as Field[],
          joins,
          locale,
          path: pathSegments.slice(1).join('.'),
          tableName: newTableName,
        });
      }

      case 'relationship':
      case 'upload': {
        newTableName = `${tableName}_relationships`;
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
        return getTableColumnFromPath({
          adapter,
          fields: flattenFields(relationshipFields) as Field[],
          joins,
          locale,
          path: pathSegments.slice(1).join('.'),
          tableName: newTableName,
        });
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
        if (locale && field.localized && adapter.payload.config.localization) {
          newTableName = `${tableName}_locales`;
          joins[newTableName] = and(
            eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
            eq(adapter[newTableName]._locale, locale),
          );
        }
        return {
          table: adapter.tables[newTableName],
          columnName: `${columnPrefix}${toSnakeCase(field.name)}`,
        };
      }
    }
  }

  throw new APIError(`Cannot find field for path at ${fieldPath}`);
};
