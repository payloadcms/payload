import { a as SQL } from 'drizzle-orm/column.d-aa4e525d';
import { Field } from 'payload/dist/fields/config/types';
import { PgSelectQueryBuilder } from 'drizzle-orm/pg-core';
import { PostgresAdapter } from '../types';
import { BuildQueryJoins } from './buildQuery';

type SearchParam = {
  path?: string,
  value: SQL,
}

// TODO: remove async
/**
 * Convert the Payload key / value / operator into a Drizzle query
 */
export async function buildSearchParam({
  selectQuery,
  joins,
  fields,
  incomingPath,
  val,
  operator,
  collectionSlug,
  globalSlug,
  adapter,
  locale,
  sort,
}: {
  selectQuery: PgSelectQueryBuilder<any, any, any, any, any>,
  fields: Field[],
  joins: BuildQueryJoins,
  incomingPath: string,
  val: unknown,
  operator: string
  collectionSlug?: string,
  globalSlug?: string,
  adapter: PostgresAdapter
  locale?: string
  sort?: string
}): Promise<SQL> {
  // Replace GraphQL nested field double underscore formatting
  const sanitizedPath = incomingPath.replace(/__/gi, '.');

  // TODO:
  //   - switch on field type
  //   - add joins
  //  return operatorKey(table[path], formattedValue);
}
