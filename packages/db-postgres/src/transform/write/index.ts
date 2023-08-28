/* eslint-disable no-param-reassign */
import { Field } from '@alessiogr/payloadtest/types';
import { traverseFields } from './traverseFields.js';
import { RowToInsert } from './types.js';

type Args = {
  data: Record<string, unknown>
  fields: Field[]
  locale: string
  path?: string
  tableName: string
}

export const transformForWrite = ({
  data,
  fields,
  locale,
  path = '',
  tableName,
}: Args): RowToInsert => {
  // Split out the incoming data into the corresponding:
  // base row, locales, relationships, blocks, and arrays
  const rowToInsert: RowToInsert = {
    row: {},
    locale: {},
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
    locale,
    localeRow: rowToInsert.locale,
    newTableName: tableName,
    parentTableName: tableName,
    path,
    relationships: rowToInsert.relationships,
    row: rowToInsert.row,
  });

  return rowToInsert;
};
