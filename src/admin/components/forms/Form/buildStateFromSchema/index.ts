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
}

const buildStateFromSchema = async (args: Args): Promise<Fields> => {
  const {
    fieldSchema,
    data: fullData = {},
    user,
    id,
    operation,
    locale,
  } = args;

  if (fieldSchema) {
    const validationPromises = [];
    const valuePromises = [];

    const resultingState = iterateFields({
      fields: fieldSchema,
      id,
      locale,
      operation,
      path: '',
      user,
      validationPromises,
      valuePromises,
      data: {},
      fullData,
      parentPassesCondition: true,
    });
    await Promise.all(validationPromises);

    // Calculate default values first
    const valueResults = valuePromises.map((promise) => promise());
    await Promise.all(valueResults);

    // Then validate once values have been calculated
    const validationResults = validationPromises.map((promise) => promise());
    await Promise.all(validationResults);

    return resultingState;
  }

  return {};
};


export default buildStateFromSchema;
