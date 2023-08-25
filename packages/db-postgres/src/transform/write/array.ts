/* eslint-disable no-param-reassign */
import toSnakeCase from 'to-snake-case';
import { ArrayField } from 'payload/types';
import { ArrayRowToInsert, BlockRowToInsert } from './types';
import { isArrayOfRows } from '../../utilities/isArrayOfRows';
import { traverseFields } from './traverseFields';

type Args = {
  arrayTableName: string
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  columnName: string
  data: unknown
  field: ArrayField
  locale?: string
  path: string
  relationships: Record<string, unknown>[]
}

export const transformArray = ({
  arrayTableName,
  blocks,
  columnName,
  data,
  field,
  locale,
  path,
  relationships,
}: Args) => {
  const newRows: ArrayRowToInsert[] = [];

  if (isArrayOfRows(data)) {
    data.forEach((arrayRow, i) => {
      const newRow: ArrayRowToInsert = {
        arrays: {},
        columnName,
        existingLocales: [],
        locale: {
          _locale: locale,
        },
        row: {
          _order: i + 1,
        },
      };

      if (field.localized) {
        newRow.row._locale = locale;
      }

      traverseFields({
        arrays: newRow.arrays,
        blocks,
        columnPrefix: '',
        data: arrayRow,
        existingLocales: newRow.existingLocales,
        fields: field.fields,
        locale,
        localeRow: newRow.locale,
        newTableName: arrayTableName,
        parentTableName: arrayTableName,
        path: `${path || ''}${field.name}.${i}.`,
        relationships,
        row: newRow.row,
      });

      newRows.push(newRow);
    });
  }

  return newRows;
};
