import mongoose, { SchemaType } from 'mongoose';
import { createArrayFromCommaDelineated } from './createArrayFromCommaDelineated';
import { getSchemaTypeOptions } from './getSchemaTypeOptions';
import wordBoundariesRegex from '../utilities/wordBoundariesRegex';

export const sanitizeQueryValue = (schemaType: SchemaType, path: string, operator: string, val: any): unknown => {
  let formattedValue = val;
  const schemaOptions = getSchemaTypeOptions(schemaType);

  // Disregard invalid _ids

  if (path === '_id' && typeof val === 'string' && val.split(',').length === 1) {
    if (schemaType?.instance === 'ObjectID') {
      const isValid = mongoose.Types.ObjectId.isValid(val);

      if (!isValid) {
        return undefined;
      }
    }

    if (schemaType?.instance === 'Number') {
      const parsedNumber = parseFloat(val);

      if (Number.isNaN(parsedNumber)) {
        return undefined;
      }
    }
  }

  // Cast incoming values as proper searchable types

  if (schemaType?.instance === 'Boolean' && typeof val === 'string') {
    if (val.toLowerCase() === 'true') formattedValue = true;
    if (val.toLowerCase() === 'false') formattedValue = false;
  }

  if (schemaType?.instance === 'Number' && typeof val === 'string') {
    formattedValue = Number(val);
  }

  if ((schemaOptions?.ref || schemaOptions?.refPath) && val === 'null') {
    formattedValue = null;
  }

  // Set up specific formatting necessary by operators

  if (operator === 'near') {
    let lng;
    let lat;
    let maxDistance;
    let minDistance;

    if (Array.isArray(formattedValue)) {
      [lng, lat, maxDistance, minDistance] = formattedValue;
    }

    if (typeof formattedValue === 'string') {
      [lng, lat, maxDistance, minDistance] = createArrayFromCommaDelineated(formattedValue);
    }

    if (!lng || !lat || (!maxDistance && !minDistance)) {
      formattedValue = undefined;
    } else {
      formattedValue = {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      };

      if (maxDistance) formattedValue.$maxDistance = parseFloat(maxDistance);
      if (minDistance) formattedValue.$minDistance = parseFloat(minDistance);
    }
  }

  if (['all', 'not_in', 'in'].includes(operator) && typeof formattedValue === 'string') {
    formattedValue = createArrayFromCommaDelineated(formattedValue);
  }

  if (schemaOptions && (schemaOptions.ref || schemaOptions.refPath) && operator === 'in') {
    if (Array.isArray(formattedValue)) {
      formattedValue = formattedValue.reduce((formattedValues, inVal) => {
        const newValues = [inVal];
        if (mongoose.Types.ObjectId.isValid(inVal)) newValues.push(new mongoose.Types.ObjectId(inVal));

        const parsedNumber = parseFloat(inVal);
        if (!Number.isNaN(parsedNumber)) newValues.push(parsedNumber);

        return [
          ...formattedValues,
          ...newValues,
        ];
      }, []);
    }
  }

  if (path !== '_id') {
    if (operator === 'contains') {
      formattedValue = { $regex: formattedValue, $options: 'i' };
    }

    if (operator === 'like' && typeof formattedValue === 'string') {
      const $regex = wordBoundariesRegex(formattedValue);
      formattedValue = { $regex };
    }
  }

  if (operator === 'exists') {
    formattedValue = (formattedValue === 'true' || formattedValue === true);
  }

  return formattedValue;
};
