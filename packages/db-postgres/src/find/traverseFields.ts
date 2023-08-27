/* eslint-disable no-param-reassign */
import toSnakeCase from 'to-snake-case';
import { fieldAffectsData } from 'payload/dist/fields/config/types';
import { ArrayField, Block, Field } from 'payload/types';
import { Result } from './buildFindManyArgs';
import { PostgresAdapter } from '../types';

type TraverseFieldArgs = {
  adapter: PostgresAdapter
  currentArgs: Record<string, unknown>,
  currentTableName: string
  depth?: number,
  fields: Field[]
  _locales: Record<string, unknown>
  locatedArrays: { [path: string]: ArrayField },
  locatedBlocks: Block[],
  path: string,
  topLevelArgs: Record<string, unknown>,
  topLevelTableName: string
}

export const traverseFields = ({
  adapter,
  currentArgs,
  currentTableName,
  depth,
  fields,
  _locales,
  locatedArrays,
  locatedBlocks,
  path,
  topLevelArgs,
  topLevelTableName,
}: TraverseFieldArgs) => {
  fields.forEach((field) => {
    if (fieldAffectsData(field)) {
      switch (field.type) {
        case 'array': {
          const withArray: Result = {
            orderBy: ({ _order }, { asc }) => [asc(_order)],
            columns: {
              _parentID: false,
              _order: false,
            },
            with: {},
          };

          const arrayTableName = `${currentTableName}_${toSnakeCase(field.name)}`;

          if (adapter.tables[`${arrayTableName}_locales`]) withArray.with._locales = _locales;
          currentArgs.with[`${path}${field.name}`] = withArray;

          traverseFields({
            adapter,
            currentArgs: withArray,
            currentTableName: arrayTableName,
            depth,
            fields: field.fields,
            _locales,
            locatedArrays,
            locatedBlocks,
            path: '',
            topLevelArgs,
            topLevelTableName,
          });

          break;
        }

        case 'blocks':
          field.blocks.forEach((block) => {
            const blockKey = `_blocks_${block.slug}`;

            if (!topLevelArgs[blockKey]) {
              const withBlock: Result = {
                columns: {
                  _parentID: false,
                },
                orderBy: ({ _order }, { asc }) => [asc(_order)],
                with: {},
              };

              if (adapter.tables[`${topLevelTableName}_${toSnakeCase(block.slug)}_locales`]) withBlock.with._locales = _locales;
              topLevelArgs.with[blockKey] = withBlock;

              traverseFields({
                adapter,
                currentArgs: withBlock,
                currentTableName,
                depth,
                fields: block.fields,
                _locales,
                locatedArrays,
                locatedBlocks,
                path,
                topLevelArgs,
                topLevelTableName,
              });
            }
          });

          break;

        case 'group':
          traverseFields({
            adapter,
            currentArgs,
            currentTableName,
            depth,
            fields: field.fields,
            _locales,
            locatedArrays,
            locatedBlocks,
            path: `${path}${field.name}_`,
            topLevelArgs,
            topLevelTableName,
          });

          break;

        default: {
          break;
        }
      }
    }
  });

  return topLevelArgs;
};
