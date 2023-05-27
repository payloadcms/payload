import { parsePathOrRelation } from './parsePathOrRelation';
import { PayloadRequest, Where } from '../types';
import { EntityPolicies } from './buildQuery';
import { Field } from '../fields/config/types';

export async function parseParams({
  collectionSlug,
  access,
  errors,
  fields,
  globalSlug,
  policies,
  req,
  where,
  overrideAccess,
}: {
  where: Where,
  access: Where | boolean,
  overrideAccess: boolean,
  collectionSlug?: string,
  errors: {path: string}[],
  globalSlug?: string,
  policies: EntityPolicies,
  req: PayloadRequest,
  fields: Field[],
}): Promise<Record<string, unknown>> {
  const query = await parsePathOrRelation({
    collectionSlug,
    errors,
    fields,
    globalSlug,
    policies,
    req,
    where,
    overrideAccess,
  });

  const result = {
    $and: [],
  };

  if (query) result.$and.push(query);

  if (typeof access === 'object') {
    const accessQuery = await parsePathOrRelation({
      where: access,
      overrideAccess: true,
      collectionSlug,
      errors,
      fields,
      globalSlug,
      policies,
      req,
    });
    if (accessQuery) result.$and.push(accessQuery);
  }

  return result;
}
