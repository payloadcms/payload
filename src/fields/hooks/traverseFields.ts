import { Field } from '../config/types';
import { promise } from './beforeChange/promise';

type Args = {
  fields: Field[]
  promises: Promise<void>[]
  siblingData: Record<string, unknown>
}

export const traverseFields = ({
  fields,
  promises,
}: Args): void => {
  fields.forEach((field) => {
    promises.push(promise({
      field,
    }));
  });
};
