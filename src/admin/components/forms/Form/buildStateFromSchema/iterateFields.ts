import type { TFunction } from 'i18next';
import { User } from '../../../../../auth';
import {
  Field as FieldSchema,
  fieldIsPresentationalOnly,
} from '../../../../../fields/config/types';
import { Fields, Data } from '../types';
import { addFieldStatePromise } from './addFieldStatePromise';

type Args = {
  state: Fields
  fields: FieldSchema[]
  data: Data
  fullData: Data
  parentPassesCondition: boolean
  path: string
  user: User
  locale: string
  fieldPromises: Promise<void>[]
  id: string | number
  operation: 'create' | 'update'
  t: TFunction
}

export const iterateFields = ({
  fields,
  data,
  parentPassesCondition,
  path = '',
  fullData,
  user,
  locale,
  operation,
  fieldPromises,
  id,
  state,
  t,
}: Args): void => {
  fields.forEach((field) => {
    const initialData = data;

    if (!fieldIsPresentationalOnly(field) && !field?.admin?.disabled) {
      const passesCondition = Boolean((field?.admin?.condition ? field.admin.condition(fullData || {}, initialData || {}) : true) && parentPassesCondition);

      fieldPromises.push(addFieldStatePromise({
        fullData,
        id,
        locale,
        operation,
        path,
        state,
        user,
        fieldPromises,
        field,
        passesCondition,
        data,
        t,
      }));
    }
  });
};
