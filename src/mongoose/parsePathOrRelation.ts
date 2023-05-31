/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { FilterQuery } from 'mongoose';
import deepmerge from 'deepmerge';
import { PayloadRequest, Where } from '../types';
import { buildSearchParam } from './buildSearchParams';
import { combineMerge } from '../utilities/combineMerge';
import { validOperators } from './buildQuery';
import { buildAndOrConditions } from './buildAndOrConditions';
import { Field } from '../fields/config/types';


export async function parsePathOrRelation({
  where,
  collectionSlug,
  globalSlug,
  req,
  fields,
}: {
  where: Where,
  collectionSlug?: string,
  globalSlug?: string,
  req: PayloadRequest,
  fields: Field[],
}): Promise<Record<string, unknown>> {
  let result = {} as FilterQuery<any>;

  if (typeof where === 'object') {
  // We need to determine if the whereKey is an AND, OR, or a schema path
    for (const relationOrPath of Object.keys(where)) {
      const condition = where[relationOrPath];
      let conditionOperator: '$and' | '$or';
      if (relationOrPath.toLowerCase() === 'and') {
        conditionOperator = '$and';
      } else if (relationOrPath.toLowerCase() === 'or') {
        conditionOperator = '$or';
      }
      if (Array.isArray(condition)) {
        const builtConditions = await buildAndOrConditions({
          collectionSlug,
          fields,
          globalSlug,
          req,
          where: condition,
        });
        if (builtConditions.length > 0) result[conditionOperator] = builtConditions;
      } else {
      // It's a path - and there can be multiple comparisons on a single path.
      // For example - title like 'test' and title not equal to 'tester'
      // So we need to loop on keys again here to handle each operator independently
        const pathOperators = where[relationOrPath];
        if (typeof pathOperators === 'object') {
          for (const operator of Object.keys(pathOperators)) {
            if (validOperators.includes(operator)) {
              const searchParam = await buildSearchParam({
                collectionSlug,
                globalSlug,
                req,
                fields,
                incomingPath: relationOrPath,
                val: pathOperators[operator],
                operator,
              });

              if (searchParam?.value && searchParam?.path) {
                result = {
                  ...result,
                  [searchParam.path]: searchParam.value,
                };
              } else if (typeof searchParam?.value === 'object') {
                result = deepmerge(result, searchParam.value, { arrayMerge: combineMerge });
              }
            }
          }
        }
      }
    }
  }

  return result;
}
