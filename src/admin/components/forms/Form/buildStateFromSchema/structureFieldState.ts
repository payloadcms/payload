import { User } from '../../../../../auth';
import {
  FieldAffectingData,
} from '../../../../../fields/config/types';
import { Fields, Field, Data } from '../types';
import { buildValuePromise } from './buildValuePromise';
import { buildValidationPromise } from './buildValidationPromise';

type Args = {
  field: FieldAffectingData
  passesCondition: boolean
  data: Data
  fullData: Data
  valuePromises: (() => Promise<void>)[]
  validationPromises: (() => Promise<void>)[]
  locale: string
  user: User
  id: string | number
  operation: 'create' | 'update'
  state: Fields
  path: string
}

export const structureFieldState = ({
  field,
  passesCondition,
  data = {},
  valuePromises,
  validationPromises,
  user,
  locale,
  id,
  operation,
  path,
  state,
  fullData,
}: Args): Partial<Field> => {
  const fieldState = {
    valid: true,
    validate: field.validate,
    condition: field.admin?.condition,
    passesCondition,
  };

  valuePromises.push(() => buildValuePromise({
    fieldState,
    field,
    locale,
    user,
    state,
    path,
    passesCondition,
    valuePromises,
    validationPromises,
    id,
    operation,
    fullData,
    data,
  }));

  validationPromises.push(() => buildValidationPromise(fieldState, {
    ...field,
    data: fullData,
    user,
    siblingData: data,
    id,
    operation,
  }));

  return fieldState;
};
