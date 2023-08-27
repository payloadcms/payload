import { PayloadRequest, RequestContext } from '../../../express/types.js';
import { Field, TabAsField } from '../../config/types.js';
import { promise } from './promise.js';

type Args<T> = {
  data: T
  doc: T
  fields: (Field | TabAsField)[]
  id?: string | number
  operation: 'create' | 'update'
  overrideAccess: boolean
  req: PayloadRequest
  siblingData: Record<string, unknown>
  siblingDoc: Record<string, unknown>
  context: RequestContext
}

export const traverseFields = async <T>({
  data,
  doc,
  fields,
  id,
  operation,
  overrideAccess,
  req,
  siblingData,
  siblingDoc,
  context,
}: Args<T>): Promise<void> => {
  const promises = [];
  fields.forEach((field) => {
    promises.push(promise({
      data,
      doc,
      field,
      id,
      operation,
      overrideAccess,
      req,
      siblingData,
      siblingDoc,
      context,
    }));
  });
  await Promise.all(promises);
};
