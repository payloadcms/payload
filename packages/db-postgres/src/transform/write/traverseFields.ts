/* eslint-disable no-param-reassign */
import { Field } from 'payload/types';
import toSnakeCase from 'to-snake-case';
import { fieldAffectsData, valueIsValueWithRelation } from 'payload/dist/fields/config/types';
import { ArrayRowToInsert, BlockRowToInsert } from './types';
import { isArrayOfRows } from '../../utilities/isArrayOfRows';
import { transformArray } from './array';

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
  forceLocalized?: boolean
  locale: string
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
  forceLocalized,
  locale,
  locales,
  newTableName,
  parentTableName,
  path,
  relationships,
  row,
}: Args) => {
  fields.forEach((field) => {
    let targetRow = row;
    let columnName = '';
    let fieldData: unknown;

    if (fieldAffectsData(field)) {
      columnName = `${columnPrefix || ''}${field.name}`;

      // If the field is localized, we need to access its data based on the
      // locale being inserted
      if (field.localized || forceLocalized) {
        if (!locales[locale]) locales[locale] = {};
        targetRow = locales[locale];

        if (typeof fieldData === 'object' && fieldData !== null) {
          Object.entries(fieldData).forEach(([fieldLocale, fieldLocaleData]) => {
            // If this is the locale being created / updated,
            // set the field data equal to this locale's data
            if (fieldLocale === locale) {
              if (typeof fieldData[locale] !== 'undefined') {
                fieldData = fieldData[locale];
              }
            } else {
              // Otherwise, transform the locale row and store it
            }
          });
        }
      } else {
        fieldData = data[field.name];
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
        const arrayTableName = `${newTableName}_${toSnakeCase(field.name)}`;
        if (!arrays[arrayTableName]) arrays[arrayTableName] = [];

        const newRows = transformArray({
          arrayTableName,
          blocks,
          columnName,
          data: fieldData,
          field,
          locale,
          path,
          relationships,
        });

        arrays[arrayTableName] = arrays[arrayTableName].concat(newRows);

        break;
      }

      case 'blocks': {
        if (isArrayOfRows(fieldData)) {
          fieldData.forEach((blockRow, i) => {
            if (typeof blockRow.blockType !== 'string') return;
            const matchedBlock = field.blocks.find(({ slug }) => slug === blockRow.blockType);
            if (!matchedBlock) return;

            if (!blocks[blockRow.blockType]) blocks[blockRow.blockType] = [];

            const newRow: BlockRowToInsert = {
              arrays: {},
              row: {
                _order: i + 1,
                _path: `${path}${field.name}`,
              },
              locales: {},
            };

            if (field.localized) newRow.row._locale = locale;

            const blockTableName = `${newTableName}_${toSnakeCase(blockRow.blockType)}`;

            traverseFields({
              arrays: newRow.arrays,
              blocks,
              columnPrefix: '',
              data: blockRow,
              fields: matchedBlock.fields,
              locale,
              locales: newRow.locales,
              newTableName: blockTableName,
              parentTableName: blockTableName,
              path: `${path || ''}${field.name}.${i}.`,
              relationships,
              row: newRow.row,
            });

            blocks[blockRow.blockType].push(newRow);
          });
        }

        break;
      }

      case 'group': {
        if (typeof data[field.name] === 'object' && data[field.name] !== null) {
          let targetData = data[field.name];
          if (field.localized && typeof data[field.name][locale] === 'object' && data[field.name][locale] !== null) {
            targetData = data[field.name][locale];
          }

          traverseFields({
            arrays,
            blocks,
            columnPrefix: `${columnName}_`,
            data: targetData as Record<string, unknown>,
            existingLocales,
            fields: field.fields,
            forceLocalized: field.localized,
            locale,
            locales,
            newTableName: `${parentTableName}_${toSnakeCase(field.name)}`,
            parentTableName,
            path: `${path || ''}${field.name}.`,
            relationships,
            row,
          });
        }

        break;
      }

      case 'date': {
        if (typeof fieldData === 'string') {
          const parsedDate = new Date(fieldData);
          targetRow[columnName] = parsedDate;
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

      case 'relationship':
      case 'upload': {
        const relations = Array.isArray(fieldData) ? fieldData : [fieldData];

        relations.forEach((relation, i) => {
          if (relation) {
            const relationRow: Record<string, unknown> = {
              path: `${path || ''}${field.name}`,
            };

            if ('hasMany' in field && field.hasMany) relationRow.order = i + 1;
            if (field.localized) {
              relationRow.locale = locale;

              if (Array.isArray(field.relationTo) && valueIsValueWithRelation(relation)) {
                relationRow[`${relation.relationTo}ID`] = relation.value;
                relationships.push(relationRow);
              } else {
                relationRow[`${field.relationTo}ID`] = relation;
                if (relation) relationships.push(relationRow);
              }
            } else if (Array.isArray(field.relationTo) && valueIsValueWithRelation(relation)) {
              relationRow[`${relation.relationTo}ID`] = relation.value;
              relationships.push(relationRow);
            } else {
              relationRow[`${field.relationTo}ID`] = relation;
              if (relation) relationships.push(relationRow);
            }
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
  });
};
