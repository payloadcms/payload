import { ArrayField, Block, Field } from 'payload/types';
import { asc, DBQueryConfig, desc } from 'drizzle-orm';
import { FieldAffectingData, fieldAffectsData } from 'payload/dist/fields/config/types';
import flattenFields from 'payload/dist/utilities/flattenTopLevelFields';
import { traverseFields } from './traverseFields';
import { PostgresAdapter } from '../types';

type BuildFindQueryArgs = {
  adapter: PostgresAdapter
  depth: number
  fields: Field[]
  tableName: string
  sort?: string
}

export type Result = DBQueryConfig<'many', true, any, any>

// Generate the Drizzle query for findMany based on
// a collection field structure
export const buildFindManyArgs = ({
  adapter,
  depth,
  fields,
  tableName,
  sort,
}: BuildFindQueryArgs): Record<string, unknown> => {
  const result: Result = {
    with: {},
  };

  // sorting
  let sortField: FieldAffectingData;
  let sortDirection: typeof asc | typeof desc;
  let sortFieldName;
  if (sort && typeof sort === 'string' && sort.length > 0) {
    // asc or desc types
    if (sort[0] === '-') {
      sortDirection = desc;
      sortFieldName = sort.substring(1);
    } else {
      sortDirection = asc;
      sortFieldName = sort;
    }
    sortField = flattenFields(fields).find((field) => (fieldAffectsData(field) && field.name === sortFieldName)) as FieldAffectingData;
    if (sortField) {
      if (sortField.localized) {
        // error: column pages.slug does not exist
        // result.orderBy = sortDirection(adapter.tables[`${tableName}_locales`][sortField.name]);
      } else {
        result.orderBy = sortDirection(adapter.tables[tableName][sortField.name]);
      }
    }
  }

  const _locales: Result = {
    columns: {
      id: false,
      _parentID: false,
    },
  };

  if (sortField && sortField.localized) {
    // TODO: this is not sorting the end results
    _locales.orderBy = (table) => [sortDirection(table[sortField.name])];
  }

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
