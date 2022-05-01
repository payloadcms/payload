import { SanitizedCollectionConfig } from '../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../globals/config/types';
import { Operation } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { traverseFields } from './traverseFields';

type Args = {
  data: Record<string, unknown>
  doc?: Record<string, unknown>
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  id?: string | number
  operation: Operation
  overrideAccess: boolean
  req: PayloadRequest
}

// This hook is responsible for the following actions, in order:
// 1. Sanitize incoming data
// 2. Execute field hooks
// 3. Execute field access control

export const beforeValidate = async ({
  data,
  doc,
  entityConfig,
  id,
  operation,
  overrideAccess,
  req,
}: Args): Promise<Record<string, unknown>> => {
  const promises = [];

  const result = { ...data };

  traverseFields({
    siblingData: result,
    fields: entityConfig.fields,
    promises,
  });

  await Promise.all(promises);

  return data;
};
