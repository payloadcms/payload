import type { TFunction } from 'i18next';
import { User } from '../../../../../auth';
import { Field as FieldSchema, fieldIsPresentationalOnly } from '../../../../../fields/config/types';
import { Data, Fields } from '../types';
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
  id: string | number
  operation: 'create' | 'update'
  t: TFunction
  preferences: {
    [key: string]: unknown
  }
}

export const iterateFields = async ({
  fields,
  data,
  parentPassesCondition,
  path = '',
  fullData,
  user,
  locale,
  operation,
  id,
  state,
  t,
  preferences,
}: Args): Promise<void> => {
  const promises = [];
  fields.forEach((field) => {
    const initialData = data;
    if (!fieldIsPresentationalOnly(field) && !field?.admin?.disabled) {
      const passesCondition = Boolean((field?.admin?.condition ? field.admin.condition(fullData || {}, initialData || {}, { user }) : true) && parentPassesCondition);

      promises.push(addFieldStatePromise({
        fullData,
        id,
        locale,
        operation,
        path,
        state,
        user,
        field,
        passesCondition,
        data,
        t,
        preferences,
      }));
    }
  });
  await Promise.all(promises);
};
