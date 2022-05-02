import { Field } from '../../config/types';
import { promise } from './promise';
import { PayloadRequest } from '../../../express/types';

type Args = {
  data: Record<string, unknown>
  doc: Record<string, unknown>
  fields: Field[]
  operation: 'create' | 'update'
  promises: Promise<void>[]
  req: PayloadRequest
  siblingData: Record<string, unknown>
  siblingDoc: Record<string, unknown>
}

export const traverseFields = ({
  data,
  doc,
  fields,
  operation,
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
      operation,
      promises,
      req,
      siblingData,
      siblingDoc,
    }));
  });
};
