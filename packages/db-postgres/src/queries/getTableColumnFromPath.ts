/* eslint-disable no-param-reassign */
import { Field, FieldAffectingData, fieldAffectsData, TabAsField, tabHasName } from 'payload/dist/fields/config/types';
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
  field: FieldAffectingData
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
}: Args): TableColumn => {
  const fieldPath = pathSegments[0];
  const field = flattenFields(fields as Field[])
    .find((fieldToFind) => fieldAffectsData(fieldToFind) && fieldToFind.name === fieldPath) as Field | TabAsField;
  let newTableName = tableName;

  if (!field && fieldPath === 'id') {
    return {
      collectionPath,
      field: {
        name: 'id',
        type: 'number',
      },
      table: adapter.tables[newTableName],
      columnName: 'id',
    };
  }

  if (field) {
    switch (field.type) {
      case 'tabs': {
        return getTableColumnFromPath({
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
        });
      }
      case 'tab': {
        if (tabHasName(field)) {
          return getTableColumnFromPath({
            adapter,
            collectionPath,
            columnPrefix: `${columnPrefix}${field.name}_`,
            fields: field.fields as Field[],
            joins,
            locale,
            pathSegments: pathSegments.slice(1),
            tableName: newTableName,
          });
        }
        return getTableColumnFromPath({
          adapter,
          collectionPath,
          columnPrefix,
          fields: field.fields as Field[],
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
        });
      }

      case 'group': {
        if (locale && field.localized && adapter.payload.config.localization) {
          newTableName = `${tableName}_locales`;
          joins[tableName] = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID);
        }
        return getTableColumnFromPath({
          adapter,
          collectionPath,
          columnPrefix: `${columnPrefix}${field.name}_`,
          fields: field.fields as Field[],
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
        });
      }

      case 'array': {
        newTableName = `${tableName}_${toSnakeCase(field.name)}`;
        if (locale && field.localized && adapter.payload.config.localization) {
          joins[newTableName] = and(
            eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
            eq(adapter[newTableName]._locale, locale),
          );
        } else {
          joins[newTableName] = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID);
        }
        return getTableColumnFromPath({
          adapter,
          collectionPath,
          fields: field.fields as Field[],
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
        });
      }

      case 'blocks': {
        // TODO: implement blocks
        throw new Error('not implemented');
      }

      case 'relationship':
      case 'upload': {
        let relationshipFields;
        if (typeof field.relationTo === 'string') {
          newTableName = `${toSnakeCase(field.relationTo)}`;
          joins[newTableName] = eq(adapter.tables[newTableName].id, adapter.tables[`${toSnakeCase(tableName)}_relationships`][`${toSnakeCase(field.relationTo)}ID`]);
          relationshipFields = adapter.payload.collections[field.relationTo].config.fields;
          if (locale && field.localized && adapter.payload.config.localization) {
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
          collectionPath: pathSegments.slice(1)
            .join('.'),
          fields: relationshipFields,
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
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
        if (fieldAffectsData(field)) {
          if (locale && field.localized && adapter.payload.config.localization) {
            newTableName = `${tableName}_locales`;
            joins[newTableName] = and(
              eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
              eq(adapter.tables[newTableName]._locale, locale),
            );
          }
          return {
            collectionPath,
            field,
            table: adapter.tables[newTableName],
            columnName: `${columnPrefix}${field.name}`,
          };
        }
      }
    }
  }

  throw new APIError(`Cannot find field for path at ${fieldPath}`);
};
