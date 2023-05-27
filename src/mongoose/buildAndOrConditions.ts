import { PayloadRequest, Where } from '../types';
import { parsePathOrRelation } from './parsePathOrRelation';
import { EntityPolicies } from './buildQuery';
import { Field } from '../fields/config/types';

export async function buildAndOrConditions({
  where,
  overrideAccess,
  collectionSlug,
  errors,
  globalSlug,
  policies,
  req,
  fields,
}: {
  where: Where[],
  overrideAccess: boolean,
  collectionSlug?: string,
  errors: {path: string}[],
  globalSlug?: string,
  policies: EntityPolicies,
  req: PayloadRequest,
  fields: Field[],
}): Promise<Record<string, unknown>[]> {
  const completedConditions = [];
  // Loop over all AND / OR operations and add them to the AND / OR query param
  // Operations should come through as an array
  // eslint-disable-next-line no-restricted-syntax
  for (const condition of where) {
  // If the operation is properly formatted as an object
    if (typeof condition === 'object') {
      // eslint-disable-next-line no-await-in-loop
      const result = await parsePathOrRelation({
        where: condition,
        overrideAccess,
        collectionSlug,
        errors,
        globalSlug,
        policies,
        req,
        fields,
      });
      if (Object.keys(result).length > 0) {
        completedConditions.push(result);
      }
    }
  }
  return completedConditions;
}
