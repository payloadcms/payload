import { PayloadRequest } from '../../../express/types';
import { Field, TabAsField } from '../../config/types';
import { promise } from './promise';

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
    }));
  });
  await Promise.all(promises);
};
