import merge from 'deepmerge';
import { User } from '../auth';
import { Operation } from '../types';
import { HookName, FieldAffectingData } from './config/types';

type Arguments = {
  hook: HookName
  field: FieldAffectingData
  path: string
  errors: {message: string, field: string}[]
  data: Record<string, unknown>
  fullData: Record<string, unknown>
  originalDoc: Record<string, unknown>
  fullOriginalDoc: Record<string, unknown>
  id?: string | number
  skipValidation?: boolean
  user: User
  operation: Operation
}

const validationPromise = async ({
  errors,
  hook,
  originalDoc,
  fullOriginalDoc,
  data,
  fullData,
  id,
  field,
  path,
  skipValidation,
  user,
  operation,
}: Arguments): Promise<string | boolean> => {
  if (hook !== 'beforeChange' || skipValidation) return true;

  const hasCondition = field.admin && field.admin.condition;
  const shouldValidate = field.validate && !hasCondition;

  let valueToValidate = data?.[field.name];
  if (valueToValidate === undefined) valueToValidate = originalDoc?.[field.name];
  if (valueToValidate === undefined) valueToValidate = field.defaultValue;

  const result = shouldValidate ? await field.validate(valueToValidate, {
    ...field,
    data: merge(fullOriginalDoc, fullData),
    siblingData: merge(originalDoc, data),
    id,
    operation,
    user,
  }) : true;

  if (typeof result === 'string') {
    errors.push({
      message: result,
      field: `${path}${field.name}`,
    });
  }

  return result;
};

export default validationPromise;
