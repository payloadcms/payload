/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { FilterQuery } from 'mongoose';
import deepmerge from 'deepmerge';
import { PayloadRequest, Where } from '../types';
import { buildSearchParam } from './buildSearchParams';
import { combineMerge } from '../utilities/combineMerge';
import { EntityPolicies, validOperators } from './buildQuery';
import { buildAndOrConditions } from './buildAndOrConditions';
import { Field } from '../fields/config/types';

export async function parsePathOrRelation({
  where,
  overrideAccess,
  collectionSlug,
  errors,
  globalSlug,
  policies,
  req,
  fields,
}: {
  where: Where,
  overrideAccess: boolean,
  collectionSlug?: string,
  errors: {path: string}[],
  globalSlug?: string,
  policies: EntityPolicies,
  req: PayloadRequest,
  fields: Field[],
}): Promise<Record<string, unknown>> {
  let result = {} as FilterQuery<any>;

  if (typeof where === 'object') {
  // We need to determine if the whereKey is an AND, OR, or a schema path
    for (const relationOrPath of Object.keys(where)) {
      const condition = where[relationOrPath];
      if (relationOrPath.toLowerCase() === 'and' && Array.isArray(condition)) {
        const builtAndConditions = await buildAndOrConditions({
          collectionSlug,
          errors,
          fields,
          globalSlug,
          policies,
          req,
          where: condition,
          overrideAccess,
        });
        if (builtAndConditions.length > 0) result.$and = builtAndConditions;
      } else if (relationOrPath.toLowerCase() === 'or' && Array.isArray(condition)) {
        const builtOrConditions = await buildAndOrConditions({
          collectionSlug,
          errors,
          fields,
          globalSlug,
          policies,
          req,
          where: condition,
          overrideAccess,
        });
        if (builtOrConditions.length > 0) result.$or = builtOrConditions;
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
                errors,
                globalSlug,
                policies,
                req,
                fields,
                incomingPath: relationOrPath,
                val: pathOperators[operator],
                operator,
                overrideAccess,
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
