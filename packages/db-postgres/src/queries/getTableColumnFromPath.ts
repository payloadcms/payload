/* eslint-disable no-param-reassign */
import type { SQL } from 'drizzle-orm';
import type { Field, FieldAffectingData, TabAsField } from 'payload/types';

import { and, eq, sql } from 'drizzle-orm';
import { APIError } from 'payload/errors';
import { fieldAffectsData, tabHasName } from 'payload/types';
import { flattenTopLevelFields } from 'payload/utilities';
import toSnakeCase from 'to-snake-case';

import type { GenericColumn, GenericTable, PostgresAdapter } from '../types';
import type { BuildQueryJoins } from './buildQuery';

type Constraint = {
  columnName: string
  table: GenericTable
  value: unknown
}

type TableColumn = {
  columnName?: string
  constraints: Constraint[]
  field: FieldAffectingData
  rawColumn?: SQL
  table: GenericTable
}

type Args = {
  adapter: PostgresAdapter,
  collectionPath: string
  columnPrefix?: string
  constraints?: Constraint[]
  fields: (Field | TabAsField)[]
  joins: BuildQueryJoins
  locale?: string
  pathSegments: string[]
  selectFields: Record<string, GenericColumn>
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
  locale,
  pathSegments,
  selectFields,
  tableName,
}: Args): TableColumn => {
  const fieldPath = pathSegments[0];
  const field = flattenTopLevelFields(fields as Field[])
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
          selectFields,
          tableName: newTableName,
        });
      }
      case 'tab': {
        if (tabHasName(field)) {
          return getTableColumnFromPath({
            adapter,
            collectionPath,
            columnPrefix: `${columnPrefix}${field.name}_`,
            constraints,
            fields: field.fields ,
            joins,
            locale,
            pathSegments: pathSegments.slice(1),
            selectFields,
            tableName: newTableName,
          });
        }
        return getTableColumnFromPath({
          adapter,
          collectionPath,
          columnPrefix,
          constraints,
          fields: field.fields ,
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          selectFields,
          tableName: newTableName,
        });
      }

      case 'group': {
        if (locale && field.localized && adapter.payload.config.localization) {
          newTableName = `${tableName}_locales`;
          joins[tableName] = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID);
          if (locale !== 'all') {
            constraints.push({
                columnName: '_locale',
                table: adapter.tables[newTableName],
                value: locale,
            });
          }
        }
        return getTableColumnFromPath({
          adapter,
          collectionPath,
          columnPrefix: `${columnPrefix}${field.name}_`,
          constraints,
          fields: field.fields ,
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          selectFields,
          tableName: newTableName,
        });
      }

      case 'array': {
        newTableName = `${tableName}_${toSnakeCase(field.name)}`;
        if (locale && field.localized && adapter.payload.config.localization) {
          joins[newTableName] = and(
            eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
            eq(adapter.tables[newTableName]._locale, locale),
          );
          if (locale !== 'all') {
            constraints.push({
              columnName: '_locale',
              table: adapter.tables[newTableName],
              value: locale,
            });
          }
        } else {
          joins[newTableName] = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID);
        }
        return getTableColumnFromPath({
          adapter,
          collectionPath,
          constraints,
          fields: field.fields,
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          selectFields,
          tableName: newTableName,
        });
      }

      case 'blocks': {
        let blockTableColumn: TableColumn;
        let newTableName: string;
        const hasBlockField = field.blocks.some((block) => {
          newTableName = `${tableName}_${toSnakeCase(block.slug)}`;
          let result;
          const blockConstraints = [];
          const blockSelectFields = {};
          try {
            result = getTableColumnFromPath({
              adapter,
              collectionPath,
              constraints: blockConstraints,
              fields: block.fields,
              joins,
              locale,
              pathSegments: pathSegments.slice(1),
              selectFields: blockSelectFields,
              tableName: newTableName,
            });
          } catch (error) {
            // this is fine, not every block will have the field
          }
        if (!result) {
          return;
        }
        blockTableColumn = result;
        constraints = constraints.concat(blockConstraints);
        selectFields = {...selectFields, ...blockSelectFields};
        if (field.localized && adapter.payload.config.localization) {
          joins[newTableName] = and(
            eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
            eq(adapter.tables[newTableName]._locale, locale),
          );
          if (locale) {
            constraints.push({
              columnName: '_locale',
              table: adapter.tables[newTableName],
              value: locale,
            });
          }
        } else {
          joins[newTableName] = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID);
        }
        return result;
        });
        if (hasBlockField) {
          return {
            columnName: blockTableColumn.columnName,
            constraints,
            field: blockTableColumn.field,
            rawColumn: blockTableColumn.rawColumn,
            table: adapter.tables[newTableName],
          };
        }
        break;
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
          joins[newTableName] = eq(adapter.tables[newTableName].id, adapter.tables[`${tableName}_relationships`][`${field.relationTo}ID`]);
          if (newCollectionPath === '') {
            return {
              columnName: `${field.relationTo}ID`,
              constraints,
              field,
              table: adapter.tables[relationTableName],
            };
          }
        } else if (newCollectionPath === 'value') {
          const tableColumnsNames = field.relationTo.map((relationTo) => `"${relationTableName}"."${toSnakeCase(relationTo)}_id"`);
          return {
            constraints,
            field,
            rawColumn: sql.raw(`COALESCE(${tableColumnsNames.join(', ')})`),
            table: adapter.tables[relationTableName],
          };
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
          selectFields,
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
          if (field.localized && adapter.payload.config.localization) {
            newTableName = `${tableName}_locales`;
            joins[newTableName] = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID);
            if (locale !== 'all') {
              constraints.push({
                columnName: '_locale',
                table: adapter.tables[newTableName],
                value: locale,
              });
            }
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
