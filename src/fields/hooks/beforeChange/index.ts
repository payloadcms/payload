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
// 1. Merge data to change into original document, if it exists
// 2. Execute create / update field access control
// 3. Sanitize incoming values
// 4. Execute field hooks
// 5. Get default values for undefined fields
// 6. Validate data

export const beforeChange = async ({
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
