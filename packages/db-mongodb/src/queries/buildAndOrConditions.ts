import { Where, Field } from '@alessiogr/payloadtest/types';
import { Payload } from '@alessiogr/payloadtest';
import { parseParams } from './parseParams';

export async function buildAndOrConditions({
  where,
  collectionSlug,
  globalSlug,
  payload,
  locale,
  fields,
}: {
  where: Where[],
  collectionSlug?: string,
  globalSlug?: string,
  payload: Payload,
  locale?: string,
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
      const result = await parseParams({
        where: condition,
        collectionSlug,
        globalSlug,
        payload,
        locale,
        fields,
      });
      if (Object.keys(result).length > 0) {
        completedConditions.push(result);
      }
    }
  }
  return completedConditions;
}
