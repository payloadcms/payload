import type { SQL } from 'drizzle-orm';
import type { Field, Where } from 'payload/types';

import { asc, desc } from 'drizzle-orm';

import type { GenericColumn, PostgresAdapter } from '../types';

import { getTableColumnFromPath } from './getTableColumnFromPath';
import { parseParams } from './parseParams';

export type BuildQueryJoins = Record<string, SQL>

type BuildQueryArgs = {
  adapter: PostgresAdapter
  fields: Field[]
  locale?: string
  sort?: string
  tableName: string
  where: Where
}

type Result = {
  joins: BuildQueryJoins
  orderBy: {
    column: GenericColumn
    order: typeof asc | typeof desc
  }
  selectFields: Record<string, GenericColumn>
  where: SQL
}
const buildQuery = async function buildQuery({
  adapter,
  fields,
  locale,
  sort,
  tableName,
  where: incomingWhere,
}: BuildQueryArgs): Promise<Result> {
  const selectFields: Record<string, GenericColumn> = {
    id: adapter.tables[tableName].id,
  };
  const joins: BuildQueryJoins = {};
  const orderBy: Result['orderBy'] = {
    column: null,
    order: null,
  };

  if (sort) {
    let sortPath;

    if (sort[0] === '-') {
      sortPath = sort.substring(1);
      orderBy.order = desc;
    } else {
      sortPath = sort;
      orderBy.order = asc;
    }

    const {
      columnName: sortTableColumnName,
      table: sortTable,
    } = getTableColumnFromPath({
      adapter,
      collectionPath: sortPath,
      fields,
      joins,
      locale,
      pathSegments: sortPath.split('.'),
      selectFields,
      tableName,
    });

    orderBy.column = sortTable[sortTableColumnName];

    if (orderBy.column) {
      selectFields.sort = orderBy.column;
    }
  }

  let where: SQL;

  if (Object.keys(incomingWhere).length > 0) {
    where = await parseParams({
      adapter,
      fields,
      joins,
      locale,
      selectFields,
      tableName,
      where: incomingWhere,
    });
  }

  return {
    joins,
    orderBy,
    selectFields,
    where,
  };
};

export default buildQuery;
