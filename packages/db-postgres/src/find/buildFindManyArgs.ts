import { ArrayField, Block, Field } from 'payload/types';
import { DBQueryConfig } from 'drizzle-orm';
import { traverseFields } from './traverseFields';
import { PostgresAdapter } from '../types';

type BuildFindQueryArgs = {
  adapter: PostgresAdapter
  depth: number
  fields: Field[]
  tableName: string
}

export type Result = DBQueryConfig<'many', true, any, any>

// Generate the Drizzle query for findMany based on
// a collection field structure
export const buildFindManyArgs = ({
  adapter,
  depth,
  fields,
  tableName,
}: BuildFindQueryArgs): Record<string, unknown> => {
  const result: Result = {
    with: {},
  };

  const _locales: Result = {
    columns: {
      id: false,
      _parentID: false,
    },
  };

  if (adapter.tables[`${tableName}_relationships`]) {
    result.with._relationships = {
      orderBy: ({ order }, { asc: ASC }) => [ASC(order)],
      columns: {
        id: false,
        parent: false,
      },
    };
  }

  if (adapter.tables[`${tableName}_locales`]) {
    result.with._locales = _locales;
  }

  const locatedBlocks: Block[] = [];
  const locatedArrays: { [path: string]: ArrayField } = {};

  traverseFields({
    adapter,
    currentArgs: result,
    currentTableName: tableName,
    depth,
    fields,
    _locales,
    locatedArrays,
    locatedBlocks,
    path: '',
    topLevelArgs: result,
    topLevelTableName: tableName,
  });

  return result;
};
