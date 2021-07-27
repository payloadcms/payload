import { Field, HookName } from './config/types';

type Arguments = {
  hook: HookName
  field: Field
  path: string
  errors: {message: string, field: string}[]
  newData: Record<string, unknown>
  existingData: Record<string, unknown>
  skipValidation?: boolean
}

const validationPromise = async ({
  errors,
  hook,
  newData,
  existingData,
  field,
  path,
  skipValidation,
}: Arguments): Promise<string | boolean> => {
  if (hook !== 'beforeChange' || skipValidation) return true;

  const hasCondition = field.admin && field.admin.condition;
  const shouldValidate = field.validate && !hasCondition;

  let valueToValidate = newData?.[field.name];
  if (valueToValidate === undefined) valueToValidate = existingData?.[field.name];
  if (valueToValidate === undefined) valueToValidate = field.defaultValue;

  const result = shouldValidate ? await field.validate(valueToValidate, field) : true;

  if (typeof result === 'string') {
    errors.push({
      message: result,
      field: `${path}${field.name}`,
    });
  }

  return result;
};

export default validationPromise;
