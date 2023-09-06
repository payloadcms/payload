import { Where } from 'payload/dist/types';
import { Field } from 'payload/dist/fields/config/types';
import { asc, desc, SQL } from 'drizzle-orm';
import { parseParams } from './parseParams';
import { GenericColumn, PostgresAdapter } from '../types';
import { getTableColumnFromPath } from './getTableColumnFromPath';

export type BuildQueryJoins = Record<string, SQL>

type BuildQueryArgs = {
  adapter: PostgresAdapter
  fields: Field[]
  locale?: string
  sort: string
  tableName: string
  where: Where
}

type Result = {
  where: SQL
  orderBy: {
    column: GenericColumn
    order: typeof asc | typeof desc
  }
  joins: BuildQueryJoins
}
const buildQuery = async function buildQuery({
  adapter,
  fields,
  locale,
  sort,
  tableName,
  where: incomingWhere,
}: BuildQueryArgs): Promise<Result> {
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
      table: sortTable,
      columnName: sortTableColumnName,
    } = getTableColumnFromPath({
      adapter,
      collectionPath: sortPath,
      fields,
      pathSegments: sortPath.split('.'),
      joins,
      locale,
      tableName,
    });

    orderBy.column = sortTable[sortTableColumnName];
  }

  let where: SQL;

  if (Object.keys(incomingWhere).length > 0) {
    where = await parseParams({
      adapter,
      fields,
      joins,
      locale,
      tableName,
      where: incomingWhere,
    });
  }

  return {
    joins,
    orderBy,
    where,
  };
};

export default buildQuery;
