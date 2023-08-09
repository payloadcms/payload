/* eslint-disable no-param-reassign */
import { SanitizedConfig } from 'payload/config';
import { fieldAffectsData } from 'payload/dist/fields/config/types';
import { ArrayField, Block, Field } from 'payload/types';
import { hasLocalesTable } from '../utilities/hasLocalesTable';
import { Result } from './buildFindManyArgs';

type TraverseFieldArgs = {
  config: SanitizedConfig,
  currentArgs: Record<string, unknown>,
  depth?: number,
  fields: Field[]
  _locales: Record<string, unknown>
  locatedArrays: { [path: string]: ArrayField },
  locatedBlocks: Block[],
  path: string,
  topLevelArgs: Record<string, unknown>,
}

export const traverseFields = ({
  config,
  currentArgs,
  depth,
  fields,
  _locales,
  locatedArrays,
  locatedBlocks,
  path,
  topLevelArgs,
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

          if (hasLocalesTable(field.fields) && _locales) withArray.with._locales = _locales;
          currentArgs.with[`${path}${field.name}`] = withArray;

          traverseFields({
            config,
            currentArgs: withArray,
            depth,
            fields: field.fields,
            _locales,
            locatedArrays,
            locatedBlocks,
            path: '',
            topLevelArgs,
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

              if (hasLocalesTable(block.fields) && _locales) withBlock.with._locales = _locales;
              topLevelArgs.with[blockKey] = withBlock;

              traverseFields({
                config,
                currentArgs: withBlock,
                depth,
                fields: block.fields,
                _locales,
                locatedArrays,
                locatedBlocks,
                path,
                topLevelArgs,
              });
            }
          });

          break;

        case 'group':
          traverseFields({
            config,
            currentArgs,
            depth,
            fields: field.fields,
            _locales,
            locatedArrays,
            locatedBlocks,
            path: `${path}${field.name}_`,
            topLevelArgs,
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
