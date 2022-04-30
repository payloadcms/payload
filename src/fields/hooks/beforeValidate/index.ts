import { SanitizedCollectionConfig } from '../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../globals/config/types';
import { Operation } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { traverseFields } from '../traverseFields';

type Args = {
  data: Record<string, unknown>
  doc?: Record<string, unknown>
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  id?: string | number
  operation: Operation
  overrideAccess: boolean
  req: PayloadRequest
  skipValidation?: boolean
}

// This hook is responsible for the following actions, in order:
// 1. Execute field hooks

export const beforeValidate = async ({
  data,
  doc,
  entityConfig,
  id,
  operation,
  overrideAccess,
  req,
  skipValidation,
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
