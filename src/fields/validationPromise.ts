import { User } from 'payload/auth';
import { Operation } from 'payload/types';
import { HookName, FieldAffectingData } from './config/types';

type Arguments = {
  hook: HookName
  field: FieldAffectingData
  path: string
  errors: {message: string, field: string}[]
  newData: Record<string, unknown>
  existingData: Record<string, unknown>
  siblingData: Record<string, unknown>
  id?: string | number
  skipValidation?: boolean
  user: User
  operation: Operation
}

const validationPromise = async ({
  errors,
  hook,
  newData,
  existingData,
  siblingData,
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
  const dataToValidate = newData || existingData;

  let valueToValidate = newData?.[field.name];
  if (valueToValidate === undefined) valueToValidate = existingData?.[field.name];
  if (valueToValidate === undefined) valueToValidate = field.defaultValue;

  const result = shouldValidate ? await field.validate(valueToValidate, {
    field,
    data: dataToValidate,
    siblingData,
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
