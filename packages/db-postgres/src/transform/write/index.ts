/* eslint-disable no-param-reassign */
import { Field } from 'payload/types';
import { traverseFields } from './traverseFields';
import { RowToInsert } from './types';

type Args = {
  data: Record<string, unknown>
  fields: Field[]
  path?: string
  tableName: string
}

export const transformForWrite = ({
  data,
  fields,
  path = '',
  tableName,
}: Args): RowToInsert => {
  // Split out the incoming data into the corresponding:
  // base row, locales, relationships, blocks, and arrays
  const rowToInsert: RowToInsert = {
    row: {},
    locales: {},
    relationships: [],
    blocks: {},
    arrays: {},
  };

  // This function is responsible for building up the
  // above rowToInsert
  traverseFields({
    arrays: rowToInsert.arrays,
    blocks: rowToInsert.blocks,
    columnPrefix: '',
    data,
    fields,
    locales: rowToInsert.locales,
    newTableName: tableName,
    parentTableName: tableName,
    path,
    relationships: rowToInsert.relationships,
    row: rowToInsert.row,
  });

  return rowToInsert;
};
