import {
  FieldAffectingData,
  ValidateOptions,
} from '../../../../../fields/config/types';
import { Field } from '../types';

type Args = FieldAffectingData & ValidateOptions<unknown, unknown, unknown>;

export const buildValidationPromise = async (fieldState: Partial<Field>, args: Args) => {
  const validatedFieldState = fieldState;

  let validationResult: boolean | string = true;

  if (typeof fieldState.validate === 'function') {
    validationResult = await fieldState.validate(fieldState.value, args);
  }

  if (typeof validationResult === 'string') {
    validatedFieldState.errorMessage = validationResult;
    validatedFieldState.valid = false;
  } else {
    validatedFieldState.valid = true;
  }
};
