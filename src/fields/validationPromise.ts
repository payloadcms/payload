import { OperationArguments } from '../types';

const validationPromise = async ({
  errors,
  hook,
  newData,
  existingData,
  field,
  path,
}: OperationArguments) => {
  if (hook !== 'beforeChange') return true;

  const hasCondition = field.admin && field.admin.condition;
  const shouldValidate = field.validate && !hasCondition;

  let valueToValidate = newData[field.name];
  if (valueToValidate === undefined) valueToValidate = existingData[field.name];
  if (valueToValidate === undefined) valueToValidate = field.defaultValue;

  const result = shouldValidate ? await field.validate(valueToValidate, field) : true;

  if (!result || typeof result === 'string') {
    errors.push({
      message: result,
      field: `${path}${field.name}`,
    });
  }

  return result;
};

export default validationPromise;
