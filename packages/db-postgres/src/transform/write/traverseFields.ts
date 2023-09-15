/* eslint-disable no-param-reassign */
import type { Field } from 'payload/types';

import { fieldAffectsData } from 'payload/types';
import toSnakeCase from 'to-snake-case';

import type { ArrayRowToInsert, BlockRowToInsert } from './types';

import { isArrayOfRows } from '../../utilities/isArrayOfRows';
import { transformArray } from './array';
import { transformBlocks } from './blocks';
import { transformRelationship } from './relationships';

type Args = {
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  columnPrefix: string
  data: Record<string, unknown>
  existingLocales?: Record<string, unknown>[]
  fields: Field[]
  forcedLocale?: string
  locales: {
    [locale: string]: Record<string, unknown>
  }
  newTableName: string
  parentTableName: string
  path: string
  relationships: Record<string, unknown>[]
  row: Record<string, unknown>
}

export const traverseFields = ({
  arrays,
  blocks,
  columnPrefix,
  data,
  existingLocales,
  fields,
  forcedLocale,
  locales,
  newTableName,
  parentTableName,
  path,
  relationships,
  row,
}: Args) => {
  fields.forEach((field) => {
    let columnName = '';
    let fieldData: unknown;

    if (fieldAffectsData(field)) {
      columnName = `${columnPrefix || ''}${field.name}`;
      fieldData = data[field.name];
    }

    if (field.type === 'array') {
      const arrayTableName = `${newTableName}_${toSnakeCase(field.name)}`;
      if (!arrays[arrayTableName]) arrays[arrayTableName] = [];

      if (field.localized) {
        if (typeof data[field.name] === 'object' && data[field.name] !== null) {
          Object.entries(data[field.name]).forEach(([localeKey, localeData]) => {
            if (Array.isArray(localeData)) {
              const newRows = transformArray({
                arrayTableName,
                blocks,
                columnName,
                data: localeData,
                field,
                locale: localeKey,
                path,
                relationships,
              });

              arrays[arrayTableName] = arrays[arrayTableName].concat(newRows);
            }
          });
        }
      } else {
        const newRows = transformArray({
          arrayTableName,
          blocks,
          columnName,
          data: data[field.name],
          field,
          path,
          relationships,
        });

        arrays[arrayTableName] = arrays[arrayTableName].concat(newRows);
      }

      return;
    }

    if (field.type === 'blocks') {
      if (field.localized) {
        if (typeof data[field.name] === 'object' && data[field.name] !== null) {
          Object.entries(data[field.name]).forEach(([localeKey, localeData]) => {
            if (Array.isArray(localeData)) {
              transformBlocks({
                blocks,
                data: localeData,
                field,
                locale: localeKey,
                path,
                relationships,
                tableName: newTableName,
              });
            }
          });
        }
      } else if (isArrayOfRows(fieldData)) {
        transformBlocks({
          blocks,
          data: fieldData,
          field,
          path,
          relationships,
          tableName: newTableName,
        });
      }

      return;
    }

    if (field.type === 'group') {
      if (typeof data[field.name] === 'object' && data[field.name] !== null) {
        if (field.localized) {
          Object.entries(data[field.name]).forEach(([localeKey, localeData]) => {
            traverseFields({
              arrays,
              blocks,
              columnPrefix: `${columnName}_`,
              data: localeData as Record<string, unknown>,
              existingLocales,
              fields: field.fields,
              forcedLocale: localeKey,
              locales,
              newTableName: `${parentTableName}_${toSnakeCase(field.name)}`,
              parentTableName,
              path: `${path || ''}${field.name}.`,
              relationships,
              row,
            });
          });
        } else {
          traverseFields({
            arrays,
            blocks,
            columnPrefix: `${columnName}_`,
            data: data[field.name] as Record<string, unknown>,
            existingLocales,
            fields: field.fields,
            locales,
            newTableName: `${parentTableName}_${toSnakeCase(field.name)}`,
            parentTableName,
            path: `${path || ''}${field.name}.`,
            relationships,
            row,
          });
        }
      }

      return;
    }

    if (field.type === 'relationship') {
      const relationshipPath = `${path || ''}${field.name}`;

      if (field.localized) {
        if (typeof fieldData === 'object') {
          Object.entries(fieldData).forEach(([localeKey, localeData]) => {
            transformRelationship({
              baseRow: {
                locale: localeKey,
                path: relationshipPath,
              },
              data: localeData,
              field,
              relationships,
            });
          });
        }
      } else {
        transformRelationship({
          baseRow: {
            path: relationshipPath,
          },
          data: fieldData,
          field,
          relationships,
        });
      }

      return;
    }

    if (fieldAffectsData(field)) {
      const valuesToTransform: { localeKey?: string, ref: unknown, value: unknown }[] = [];

      if ((field.localized)) {
        if (typeof fieldData === 'object' && fieldData !== null) {
          Object.entries(fieldData).forEach(([localeKey, localeData]) => {
            if (!locales[localeKey]) locales[localeKey] = {};

            valuesToTransform.push({
              localeKey,
              ref: locales,
              value: localeData,
            });
          });
        }
      } else {
        let ref = row;

        if (forcedLocale) {
          if (!locales[forcedLocale]) locales[forcedLocale] = {};
          ref = locales[forcedLocale];
        }

        valuesToTransform.push({ ref, value: fieldData });
      }

      valuesToTransform.forEach(({ localeKey, ref, value }) => {
        if (typeof value !== 'undefined') {
          let formattedValue = value;

          switch (field.type) {
            case 'number': {
              // TODO: handle hasMany
              break;
            }

            case 'select': {
              break;
            }

            case 'date': {
              if (typeof fieldData === 'string') {
                const parsedDate = new Date(fieldData);
                formattedValue = parsedDate;
              }

              break;
            }

            // case 'tabs': {
            //   await Promise.all(field.tabs.map(async (tab) => {
            //     if ('name' in tab) {
            //       if (typeof data[tab.name] === 'object' && data[tab.name] !== null) {
            //         await traverseFields({
            //           adapter,
            //           arrayRowPromises,
            //           blockRows,
            //           columnPrefix: `${columnName}_`,
            //           data: data[tab.name] as Record<string, unknown>,
            //           fields: tab.fields,
            //           locale,
            //           localeRow,
            //           operation,
            //           path: `${path || ''}${tab.name}.`,
            //           relationshipRows,
            //           row,
            //           tableName,
            //         });
            //       }
            //     } else {
            //       await traverseFields({
            //         adapter,
            //         arrayRowPromises,
            //         blockRows,
            //         columnPrefix,
            //         data,
            //         fields: tab.fields,
            //         locale,
            //         localeRow,
            //         operation,
            //         path,
            //         relationshipRows,
            //         row,
            //         tableName,
            //       });
            //     }
            //   }));
            //   break;
            // }

            // case 'row':
            // case 'collapsible': {
            //   await traverseFields({
            //     adapter,
            //     arrayRowPromises,
            //     blockRows,
            //     columnPrefix,
            //     data,
            //     fields: field.fields,
            //     locale,
            //     localeRow,
            //     operation,
            //     path,
            //     relationshipRows,
            //     row,
            //     tableName,
            //   });
            //   break;
            // }

            default: {
              break;
            }
          }

          if (localeKey) {
            ref[localeKey][columnName] = formattedValue;
          } else {
            ref[columnName] = formattedValue;
          }
        }
      });
    }
  });
};
