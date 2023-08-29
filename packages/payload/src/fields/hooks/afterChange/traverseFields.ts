import type { PayloadRequest, RequestContext } from '../../../express/types.js';
import type { Field, TabAsField } from '../../config/types.js';

import { promise } from './promise.js';

type Args = {
  context: RequestContext
  data: Record<string, unknown>
  doc: Record<string, unknown>
  fields: (Field | TabAsField)[]
  operation: 'create' | 'update'
  previousDoc: Record<string, unknown>
  previousSiblingDoc: Record<string, unknown>
  req: PayloadRequest
  siblingData: Record<string, unknown>
  siblingDoc: Record<string, unknown>
}

export const traverseFields = async ({
  context,
  data,
  doc,
  fields,
  operation,
  previousDoc,
  previousSiblingDoc,
  req,
  siblingData,
  siblingDoc,
}: Args): Promise<void> => {
  const promises = [];

  fields.forEach((field) => {
    promises.push(promise({
      context,
      data,
      doc,
      field,
      operation,
      previousDoc,
      previousSiblingDoc,
      req,
      siblingData,
      siblingDoc,
    }));
  });

  await Promise.all(promises);
};
