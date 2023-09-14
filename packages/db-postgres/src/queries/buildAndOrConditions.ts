import { Where } from 'payload/types';
import { Field } from 'payload/dist/fields/config/types';
import { SQL } from 'drizzle-orm';
import { parseParams } from './parseParams';
import { GenericColumn, PostgresAdapter } from '../types';
import { BuildQueryJoins } from './buildQuery';

export async function buildAndOrConditions({
  joins,
  where,
  adapter,
  locale,
  fields,
  tableName,
  selectFields,
}: {
  joins: BuildQueryJoins,
  where: Where[],
  collectionSlug?: string,
  globalSlug?: string,
  adapter: PostgresAdapter
  locale?: string,
  fields: Field[],
  tableName: string,
  selectFields: Record<string, GenericColumn>
}): Promise<SQL[]> {
  const completedConditions = [];
  // Loop over all AND / OR operations and add them to the AND / OR query param
  // Operations should come through as an array
  // eslint-disable-next-line no-restricted-syntax
  for (const condition of where) {
    // If the operation is properly formatted as an object
    if (typeof condition === 'object') {
      // eslint-disable-next-line no-await-in-loop
      const result = await parseParams({
        joins,
        where: condition,
        adapter,
        locale,
        fields,
        tableName,
        selectFields,
      });
      if (result && Object.keys(result).length > 0) {
        completedConditions.push(result);
      }
    }
  }
  return completedConditions;
}
