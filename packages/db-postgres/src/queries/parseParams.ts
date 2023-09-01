/* eslint-disable no-restricted-syntax */
import type { SQL } from 'drizzle-orm';
/* eslint-disable no-await-in-loop */
import type { Operator, Where } from 'payload/types';
import type { Field } from 'payload/types';

import { and } from 'drizzle-orm';
import { validOperators } from 'payload/types';

import type { PostgresAdapter } from '../types';

import { buildAndOrConditions } from './buildAndOrConditions';
import { buildSearchParam } from './buildSearchParams';

export async function parseParams({
  adapter,
  collectionSlug,
  fields,
  globalSlug,
  locale,
  where,
}: {
  adapter: PostgresAdapter
  collectionSlug?: string,
  fields: Field[],
  globalSlug?: string,
  locale: string,
  where: Where,
}): Promise<SQL> {
  let result: SQL;

  if (typeof where === 'object') {
    // We need to determine if the whereKey is an AND, OR, or a schema path
    for (const relationOrPath of Object.keys(where)) {
      const condition = where[relationOrPath];
      let conditionOperator: 'and' | 'or';
      if (relationOrPath.toLowerCase() === 'and') {
        conditionOperator = 'and';
      } else if (relationOrPath.toLowerCase() === 'or') {
        conditionOperator = 'or';
      }
      if (Array.isArray(condition)) {
        const builtConditions = await buildAndOrConditions({
          adapter,
          collectionSlug,
          fields,
          globalSlug,
          locale,
          where: condition,
        });

        if (builtConditions.length > 0) result = and(result, ...builtConditions);
      } else {
        // It's a path - and there can be multiple comparisons on a single path.
        // For example - title like 'test' and title not equal to 'tester'
        // So we need to loop on keys again here to handle each operator independently
        const pathOperators = where[relationOrPath];
        if (typeof pathOperators === 'object') {
          for (const operator of Object.keys(pathOperators)) {
            if (validOperators.includes(operator as Operator)) {
              const searchParam = await buildSearchParam({
                adapter,
                collectionSlug,
                fields,
                globalSlug,
                incomingPath: relationOrPath,
                locale,
                operator,
                val: pathOperators[operator],
              });

              if (searchParam?.value && searchParam?.path) {
                result = and(result, searchParam.value);
                // result = {
                //   ...result,
                //   [searchParam.path]: searchParam.value,
                // };
              } else if (typeof searchParam?.value === 'object') {
                result = and(result, searchParam.value);
                // result = deepmerge(result, searchParam.value, { arrayMerge: combineMerge });
              }
            }
          }
        }
      }
    }
  }

  // await db.select().from(users).where(
  //   and(
  //     eq(users.id, 42),
  //     eq(users.name, 'Dan')
  //   )
  // );

  return result;
}
