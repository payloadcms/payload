import { parsePathOrRelation } from './parsePathOrRelation';
import { PayloadRequest, Where } from '../types';
import { Field } from '../fields/config/types';

export async function parseParams({
  collectionSlug,
  access,
  fields,
  globalSlug,
  req,
  where,
}: {
  where: Where,
  access: Where | boolean,
  collectionSlug?: string,
  globalSlug?: string,
  req: PayloadRequest,
  fields: Field[],
}): Promise<Record<string, unknown>> {
  const query = await parsePathOrRelation({
    collectionSlug,
    fields,
    globalSlug,
    req,
    where,
  });

  const result = {
    $and: [],
  };

  if (query) result.$and.push(query);

  if (typeof access === 'object') {
    const accessQuery = await parsePathOrRelation({
      where: access,
      collectionSlug,
      fields,
      globalSlug,
      req,
    });
    if (accessQuery) result.$and.push(accessQuery);
  }

  return result;
}
