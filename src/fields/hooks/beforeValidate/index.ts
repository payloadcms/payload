import { SanitizedCollectionConfig } from '../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../globals/config/types';
import { PayloadRequest, RequestContext } from '../../../express/types';
import { traverseFields } from './traverseFields';
import deepCopyObject from '../../../utilities/deepCopyObject';

type Args<T> = {
  data: T | Record<string, unknown>
  doc?: T | Record<string, unknown>
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  id?: string | number
  operation: 'create' | 'update'
  overrideAccess: boolean
  req: PayloadRequest
  context: RequestContext
}

export const beforeValidate = async <T extends Record<string, unknown>>({
  data: incomingData,
  doc,
  entityConfig,
  id,
  operation,
  overrideAccess,
  req,
  context,
}: Args<T>): Promise<T> => {
  const data = deepCopyObject(incomingData);

  await traverseFields({
    data,
    doc,
    fields: entityConfig.fields,
    id,
    operation,
    overrideAccess,
    req,
    siblingData: data,
    siblingDoc: doc,
    context,
  });

  return data;
};
