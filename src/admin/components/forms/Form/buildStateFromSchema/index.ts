import { i18n as Ii18n } from 'i18next';
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
  i18n: Ii18n
}

const buildStateFromSchema = async (args: Args): Promise<Fields> => {
  const {
    fieldSchema,
    data: fullData = {},
    user,
    id,
    operation,
    locale,
    i18n,
  } = args;

  if (fieldSchema) {
    const fieldPromises = [];
    const state: Fields = {};

    iterateFields({
      state,
      fields: fieldSchema,
      id,
      locale,
      operation,
      path: '',
      user,
      fieldPromises,
      data: fullData,
      fullData,
      parentPassesCondition: true,
      i18n,
    });

    await Promise.all(fieldPromises);

    return state;
  }

  return {};
};


export default buildStateFromSchema;
