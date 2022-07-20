import { SanitizedCollectionConfig } from '../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../globals/config/types';
import { PayloadRequest } from '../../../express/types';
import { traverseFields } from './traverseFields';
import deepCopyObject from '../../../utilities/deepCopyObject';

type Args = {
  data: Record<string, unknown>
  doc: Record<string, unknown>
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  operation: 'create' | 'update'
  req: PayloadRequest
}

export const afterChange = async ({
  data,
  doc: incomingDoc,
  entityConfig,
  operation,
  req,
}: Args): Promise<Record<string, unknown>> => {
  const doc = deepCopyObject(incomingDoc);

  await traverseFields({
    data,
    doc,
    fields: entityConfig.fields,
    operation,
    req,
    siblingDoc: doc,
    siblingData: data,
  });

  return doc;
};
