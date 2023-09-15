/* eslint-disable no-param-reassign */
import type { BlockField } from 'payload/types';

import toSnakeCase from 'to-snake-case';

import type { BlockRowToInsert } from './types';

import { traverseFields } from './traverseFields';

type Args = {
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  data: Record<string, unknown>[]
  field: BlockField
  locale?: string
  path: string
  relationships: Record<string, unknown>[]
  tableName
}
export const transformBlocks = ({
  blocks,
  data,
  field,
  locale,
  path,
  relationships,
  tableName,
}: Args) => {
  data.forEach((blockRow, i) => {
    if (typeof blockRow.blockType !== 'string') return;
    const matchedBlock = field.blocks.find(({ slug }) => slug === blockRow.blockType);
    if (!matchedBlock) return;

    if (!blocks[blockRow.blockType]) blocks[blockRow.blockType] = [];

    const newRow: BlockRowToInsert = {
      arrays: {},
      locales: {},
      row: {
        _order: i + 1,
        _path: `${path}${field.name}`,
      },
    };

    if (field.localized && locale) newRow.row._locale = locale;

    const blockTableName = `${tableName}_${toSnakeCase(blockRow.blockType)}`;

    traverseFields({
      arrays: newRow.arrays,
      blocks,
      columnPrefix: '',
      data: blockRow,
      fields: matchedBlock.fields,
      locales: newRow.locales,
      newTableName: blockTableName,
      parentTableName: blockTableName,
      path: `${path || ''}${field.name}.${i}.`,
      relationships,
      row: newRow.row,
    });

    blocks[blockRow.blockType].push(newRow);
  });
};
