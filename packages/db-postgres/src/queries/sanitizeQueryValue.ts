import type { Field, TabAsField } from 'payload/types';

import { APIError } from 'payload/errors';
import { createArrayFromCommaDelineated } from 'payload/utilities';

type SanitizeQueryValueArgs = {
  field: Field | TabAsField
  operator: string
  val: any
}

export const sanitizeQueryValue = ({ field, operator: operatorArg, val }: SanitizeQueryValueArgs): { operator: string, value: unknown } => {
  let operator = operatorArg;
  let formattedValue = val;

  // // Disregard invalid _ids
  // if (path === '_id' && typeof val === 'string' && val.split(',').length === 1) {
  //   if (!hasCustomID) {
  //     const isValid = mongoose.Types.ObjectId.isValid(val);
  //
  //     if (!isValid) {
  //       return undefined;
  //     }
  //   }
  //
  //   if (field.type === 'number') {
  //     const parsedNumber = parseFloat(val);
  //
  //     if (Number.isNaN(parsedNumber)) {
  //       return undefined;
  //     }
  //   }
  // }

  // Cast incoming values as proper searchable types
  if (field.type === 'checkbox' && typeof val === 'string') {
    if (val.toLowerCase() === 'true') formattedValue = true;
    if (val.toLowerCase() === 'false') formattedValue = false;
  }

  if (['all', 'in', 'not_in'].includes(operator) && typeof formattedValue === 'string') {
    formattedValue = createArrayFromCommaDelineated(formattedValue);

    if (field.type === 'number') {
      formattedValue = formattedValue.map((arrayVal) => parseFloat(arrayVal));
    }
  }

  if (field.type === 'number' && typeof formattedValue === 'string') {
    formattedValue = Number(val);
  }

  if (field.type === 'date' && typeof val === 'string') {
    formattedValue = new Date(val);
    if (Number.isNaN(Date.parse(formattedValue))) {
      return { operator, value: undefined };
    }
  }


  if (['relationship', 'upload'].includes(field.type)) {
    if (val === 'null') {
      formattedValue = null;
    }

    // if (operator === 'in' && Array.isArray(formattedValue)) {
    //   formattedValue = formattedValue.reduce((formattedValues, inVal) => {
    //     const newValues = [inVal];
    //     if (mongoose.Types.ObjectId.isValid(inVal)) newValues.push(new mongoose.Types.ObjectId(inVal));
    //
    //     const parsedNumber = parseFloat(inVal);
    //     if (!Number.isNaN(parsedNumber)) newValues.push(parsedNumber);
    //
    //     return [
    //       ...formattedValues,
    //       ...newValues,
    //     ];
    //   }, []);
    // }
  }

  if (operator === 'near' || operator === 'within' || operator === 'intersects') {
    throw new APIError(`Querying with '${operator}' is not supported with the postgres database adapter.`);
  }

  // if (path !== '_id' || (path === '_id' && hasCustomID && field.type === 'text')) {
  //   if (operator === 'contains') {
  //     formattedValue = { $regex: formattedValue, $options: 'i' };
  //   }
  // }

  if (operator === 'exists') {
    formattedValue = (formattedValue === 'true' || formattedValue === true);
    if (formattedValue === false) {
      operator = 'isNull';
    }
  }

  return { operator, value: formattedValue };
};
