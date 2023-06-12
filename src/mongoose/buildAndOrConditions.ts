import { PayloadRequest, Where } from '../types';
import { parsePathOrRelation } from './parsePathOrRelation';
import { Field } from '../fields/config/types';

export async function buildAndOrConditions({
  where,
  collectionSlug,
  globalSlug,
  req,
  fields,
}: {
  where: Where[],
  collectionSlug?: string,
  globalSlug?: string,
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
        collectionSlug,
        globalSlug,
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
