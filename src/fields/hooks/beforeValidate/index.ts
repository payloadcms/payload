import { SanitizedCollectionConfig } from '../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../globals/config/types';
import { PayloadRequest } from '../../../express/types';
import { traverseFields } from './traverseFields';
import deepCopyObject from '../../../utilities/deepCopyObject';

type Args = {
  data: Record<string, unknown>
  doc: Record<string, unknown>
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  id?: string | number
  operation: 'create' | 'update'
  overrideAccess: boolean
  req: PayloadRequest
}

export const beforeValidate = async ({
  data: incomingData,
  doc,
  entityConfig,
  id,
  operation,
  overrideAccess,
  req,
}: Args): Promise<Record<string, unknown>> => {
  const promises = [];
  const data = deepCopyObject(incomingData);

  traverseFields({
    data,
    doc,
    fields: entityConfig.fields,
    id,
    operation,
    overrideAccess,
    promises,
    req,
    siblingData: data,
    siblingDoc: doc,
  });

  await Promise.all(promises);

  return data;
};
