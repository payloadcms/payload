import type { TFunction } from 'i18next';
import { User } from '../../../../../auth';
import { Field as FieldSchema } from '../../../../../fields/config/types';
import { Fields, Data } from '../types';
import { iterateFields } from './iterateFields';

type Args = {
  fieldSchema: FieldSchema[]
  data?: Data,
  siblingData?: Data,
  user?: User,
  id?: string | number,
  operation?: 'create' | 'update'
  locale: string
  t: TFunction
}

const buildStateFromSchema = async (args: Args): Promise<Fields> => {
  const {
    fieldSchema,
    data: fullData = {},
    user,
    id,
    operation,
    locale,
    t,
  } = args;

  if (fieldSchema) {
    const state: Fields = {};

    await iterateFields({
      state,
      fields: fieldSchema,
      id,
      locale,
      operation,
      path: '',
      user,
      data: fullData,
      fullData,
      parentPassesCondition: true,
      t,
    });

    return state;
  }

  return {};
};


export default buildStateFromSchema;
