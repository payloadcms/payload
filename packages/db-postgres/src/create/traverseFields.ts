/* eslint-disable no-param-reassign */
import { Field } from 'payload/types';
import toSnakeCase from 'to-snake-case';
import { fieldAffectsData, valueIsValueWithRelation } from 'payload/dist/fields/config/types';
import { PostgresAdapter } from '../types';
import { ArrayRowPromise, ArrayRowPromisesMap, BlockRowsToInsert } from './types';
import { insertRows } from './insertRows';
import { isArrayOfRows } from '../utilities/isArrayOfRows';

type Args = {
  adapter: PostgresAdapter
  arrayRowPromises: ArrayRowPromisesMap
  blockRows: { [blockType: string]: BlockRowsToInsert }
  columnPrefix?: string
  data: Record<string, unknown>
  fallbackLocale?: string | false
  fields: Field[]
  locale: string
  localeRow: Record<string, unknown>
  operation: 'create' | 'update'
  path: string
  relationshipRows: Record<string, unknown>[]
  row: Record<string, unknown>
  tableName: string
}

export const traverseFields = async ({
  adapter,
  arrayRowPromises,
  blockRows,
  columnPrefix,
  data,
  fallbackLocale,
  fields,
  locale,
  localeRow,
  operation,
  path,
  relationshipRows,
  row,
  tableName,
}: Args) => {
  await Promise.all(fields.map(async (field) => {
    let targetRow = row;
    let columnName: string;
    let fieldData: unknown;

    if (fieldAffectsData(field)) {
      columnName = `${columnPrefix || ''}${field.name}`;
      fieldData = data[field.name];

      if (field.localized) {
        targetRow = localeRow;

        if (typeof data[field.name] === 'object'
          && data[field.name] !== null
          && data[field.name][locale]) {
          fieldData = data[field.name][locale];
        }
      }
    }

    switch (field.type) {
      case 'number': {
        // TODO: handle hasMany
        targetRow[columnName] = fieldData;
        break;
      }

      case 'select': {
        break;
      }

      case 'array': {
        if (isArrayOfRows(fieldData)) {
          const arrayTableName = `${tableName}_${toSnakeCase(field.name)}`;

          const promise: ArrayRowPromise = async ({ parentID }) => {
            const result = await insertRows({
              adapter,
              addRowIndexToPath: true,
              fallbackLocale,
              fields: field.fields,
              incomingBlockRows: blockRows,
              incomingRelationshipRows: relationshipRows,
              initialRowData: (fieldData as []).map((_, i) => ({
                _order: i + 1,
                _parentID: parentID,
              })),
              locale,
              operation,
              rows: fieldData as Record<string, unknown>[],
              tableName: arrayTableName,
            });

            return result.map((subRow) => {
              delete subRow._order;
              delete subRow._parentID;
              return subRow;
            });
          };

          arrayRowPromises[columnName] = promise;
        }

        break;
      }

      case 'blocks': {
        if (isArrayOfRows(fieldData)) {
          fieldData.forEach((blockRow, i) => {
            if (typeof blockRow.blockType !== 'string') return;
            const matchedBlock = field.blocks.find(({ slug }) => slug === blockRow.blockType);
            if (!matchedBlock) return;

            if (!blockRows[blockRow.blockType]) {
              blockRows[blockRow.blockType] = {
                rows: [],
                block: matchedBlock,
              };
            }
            blockRow._order = i + 1;
            blockRow._path = `${path}${field.name}`;
            blockRows[blockRow.blockType].rows.push(blockRow);
          });
        }

        break;
      }

      case 'group': {
        if (typeof data[field.name] === 'object' && data[field.name] !== null) {
          await traverseFields({
            adapter,
            arrayRowPromises,
            blockRows,
            columnPrefix: `${columnName}_`,
            data: data[field.name] as Record<string, unknown>,
            fields: field.fields,
            locale,
            localeRow,
            operation,
            path: `${path || ''}${field.name}.`,
            relationshipRows,
            row,
            tableName,
          });
        }

        break;
      }

      case 'tabs': {
        await Promise.all(field.tabs.map(async (tab) => {
          if ('name' in tab) {
            if (typeof data[tab.name] === 'object' && data[tab.name] !== null) {
              await traverseFields({
                adapter,
                arrayRowPromises,
                blockRows,
                columnPrefix: `${columnName}_`,
                data: data[tab.name] as Record<string, unknown>,
                fields: tab.fields,
                locale,
                localeRow,
                operation,
                path: `${path || ''}${tab.name}.`,
                relationshipRows,
                row,
                tableName,
              });
            }
          } else {
            await traverseFields({
              adapter,
              arrayRowPromises,
              blockRows,
              columnPrefix,
              data,
              fields: tab.fields,
              locale,
              localeRow,
              operation,
              path,
              relationshipRows,
              row,
              tableName,
            });
          }
        }));
        break;
      }

      case 'row':
      case 'collapsible': {
        await traverseFields({
          adapter,
          arrayRowPromises,
          blockRows,
          columnPrefix,
          data,
          fields: field.fields,
          locale,
          localeRow,
          operation,
          path,
          relationshipRows,
          row,
          tableName,
        });
        break;
      }

      case 'relationship':
      case 'upload': {
        const relations = Array.isArray(fieldData) ? fieldData : [fieldData];

        relations.forEach((relation, i) => {
          const relationRow: Record<string, unknown> = {
            path: `${path || ''}${field.name}`,
          };

          if ('hasMany' in field && field.hasMany) relationRow.order = i + 1;
          if (field.localized) relationRow.locale = locale;

          if (Array.isArray(field.relationTo) && valueIsValueWithRelation(relation)) {
            relationRow[`${relation.relationTo}ID`] = relation.value;
            relationshipRows.push(relationRow);
          } else {
            relationRow[`${field.relationTo}ID`] = relation;
            relationshipRows.push(relationRow);
          }
        });


        break;
      }

      default: {
        if (typeof fieldData !== 'undefined') {
          targetRow[columnName] = fieldData;
        }
        break;
      }
    }
  }));
};
