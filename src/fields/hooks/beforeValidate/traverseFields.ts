import { PayloadRequest } from '../../../express/types';
import { Field } from '../../config/types';
import { promise } from './promise';

type Args = {
  data: Record<string, unknown>
  doc: Record<string, unknown>
  fields: Field[]
  id?: string | number
  operation: 'create' | 'update'
  overrideAccess: boolean
  promises: Promise<void>[]
  req: PayloadRequest
  siblingData: Record<string, unknown>
  siblingDoc: Record<string, unknown>
}

export const traverseFields = ({
  data,
  doc,
  fields,
  id,
  operation,
  overrideAccess,
  promises,
  req,
  siblingData,
  siblingDoc,
}: Args): void => {
  fields.forEach((field) => {
    promises.push(promise({
      data,
      doc,
      field,
      id,
      operation,
      overrideAccess,
      promises,
      req,
      siblingData,
      siblingDoc,
    }));
  });
};
