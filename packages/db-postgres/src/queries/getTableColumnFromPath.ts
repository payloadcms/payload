/* eslint-disable no-param-reassign */
import { Field, FieldAffectingData, fieldAffectsData, TabAsField, tabHasName } from 'payload/dist/fields/config/types';
import toSnakeCase from 'to-snake-case';
import { and, eq } from 'drizzle-orm';
import { APIError } from 'payload/errors';
import flattenFields from 'payload/dist/utilities/flattenTopLevelFields';
import { BuildQueryJoins } from './buildQuery';
import { GenericColumn, GenericTable, PostgresAdapter } from '../types';

type Constraint = {
  table: GenericTable
  columnName: string
  value: unknown
}

type TableColumn = {
  table: GenericTable
  columnName: string
  constraints: Constraint[]
  field: FieldAffectingData
}

type Args = {
  adapter: PostgresAdapter,
  collectionPath: string
  columnPrefix?: string
  constraints?: Constraint[]
  fields: (Field | TabAsField)[]
  joins: BuildQueryJoins
  selectFields: Record<string, GenericColumn>
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
  constraints = [],
  fields,
  joins,
  selectFields,
  locale,
  pathSegments,
  tableName,
}: Args): TableColumn => {
  const fieldPath = pathSegments[0];
  const field = flattenFields(fields as Field[])
    .find((fieldToFind) => fieldAffectsData(fieldToFind) && fieldToFind.name === fieldPath) as Field | TabAsField;
  let newTableName = tableName;

  if (!field && fieldPath === 'id') {
    selectFields.id = adapter.tables[newTableName].id;
    return {
      columnName: 'id',
      constraints,
      field: {
        name: 'id',
        type: 'number',
      },
      table: adapter.tables[newTableName],
    };
  }

  if (field) {
    switch (field.type) {
      case 'tabs': {
        return getTableColumnFromPath({
          adapter,
          collectionPath,
          columnPrefix,
          constraints,
          fields: field.tabs.map((tab) => ({
            ...tab,
            type: 'tab',
          })),
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
          selectFields,
        });
      }
      case 'tab': {
        if (tabHasName(field)) {
          return getTableColumnFromPath({
            adapter,
            collectionPath,
            columnPrefix: `${columnPrefix}${field.name}_`,
            constraints,
            fields: field.fields as Field[],
            joins,
            locale,
            pathSegments: pathSegments.slice(1),
            tableName: newTableName,
            selectFields,
          });
        }
        return getTableColumnFromPath({
          adapter,
          collectionPath,
          columnPrefix,
          constraints,
          fields: field.fields as Field[],
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
          selectFields,
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
          constraints,
          fields: field.fields as Field[],
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
          selectFields,
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
          constraints,
          fields: field.fields as Field[],
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
          selectFields,
        });
      }

      case 'blocks': {
        // TODO: implement blocks
        throw new Error('not implemented');
      }

      case 'relationship':
      case 'upload': {
        let relationshipFields;
        const relationTableName = `${tableName}_relationships`;
        const newCollectionPath = pathSegments.slice(1).join('.');

        // Join in the relationships table
        joins[relationTableName] = eq(adapter.tables[tableName].id, adapter.tables[relationTableName].parent);
        selectFields[`${relationTableName}.path`] = adapter.tables[relationTableName].path;
        constraints.push({
          columnName: 'path',
          table: adapter.tables[relationTableName],
          value: field.name,
        });

        if (typeof field.relationTo === 'string') {
          newTableName = `${toSnakeCase(field.relationTo)}`;
          // parent to relationship join table
          relationshipFields = adapter.payload.collections[field.relationTo].config.fields;
          joins[newTableName] = eq(adapter.tables[newTableName].id, adapter.tables[`${toSnakeCase(tableName)}_relationships`][`${field.relationTo}ID`]);
        } else {
          throw new APIError('Not supported');
        }
        return getTableColumnFromPath({
          adapter,
          collectionPath: newCollectionPath,
          constraints,
          fields: relationshipFields,
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          tableName: newTableName,
          selectFields,
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
            joins[newTableName] = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID);
          }
          selectFields[`${newTableName}.${field.name}`] = adapter.tables[newTableName][field.name];

          return {
            columnName: `${columnPrefix}${field.name}`,
            constraints,
            field,
            table: adapter.tables[newTableName],
          };
        }
      }
    }
  }

  throw new APIError(`Cannot find field for path at ${fieldPath}`);
};
