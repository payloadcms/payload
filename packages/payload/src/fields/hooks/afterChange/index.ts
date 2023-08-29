import { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import { SanitizedGlobalConfig } from '../../../globals/config/types.js';
import { PayloadRequest, RequestContext } from '../../../express/types.js';
import { traverseFields } from './traverseFields.js';
import deepCopyObject from '../../../utilities/deepCopyObject.js';

type Args<T> = {
  data: T | Record<string, unknown>
  doc: T | Record<string, unknown>
  previousDoc: T | Record<string, unknown>
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  operation: 'create' | 'update'
  req: PayloadRequest
  context: RequestContext
}

export const afterChange = async <T extends Record<string, unknown>>({
  data,
  doc: incomingDoc,
  previousDoc,
  entityConfig,
  operation,
  req,
  context,
}: Args<T>): Promise<T> => {
  const doc = deepCopyObject(incomingDoc);

  await traverseFields({
    data,
    doc,
    previousDoc,
    fields: entityConfig.fields,
    operation,
    req,
    previousSiblingDoc: previousDoc,
    siblingDoc: doc,
    siblingData: data,
    context,
  });

  return doc;
};
