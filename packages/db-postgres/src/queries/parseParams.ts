/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { Operator, Where } from '@alessiogr/payloadtest/types';
import { Field } from '@alessiogr/payloadtest/types';
import { validOperators } from '@alessiogr/payloadtest/types';
import { and, SQL } from 'drizzle-orm';
import { buildSearchParam } from './buildSearchParams.js';
import { buildAndOrConditions } from './buildAndOrConditions.js';
import { PostgresAdapter } from '../types.js';

export async function parseParams({
  where,
  collectionSlug,
  globalSlug,
  adapter,
  locale,
  fields,
}: {
  where: Where,
  collectionSlug?: string,
  globalSlug?: string,
  adapter: PostgresAdapter
  locale: string,
  fields: Field[],
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
          collectionSlug,
          fields,
          globalSlug,
          adapter,
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
                collectionSlug,
                globalSlug,
                adapter,
                locale,
                fields,
                incomingPath: relationOrPath,
                val: pathOperators[operator],
                operator,
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
