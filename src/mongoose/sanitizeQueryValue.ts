import mongoose from 'mongoose';
import { createArrayFromCommaDelineated } from './createArrayFromCommaDelineated';
import wordBoundariesRegex from '../utilities/wordBoundariesRegex';
import { Field, TabAsField } from '../fields/config/types';

type SanitizeQueryValueArgs = {
  field: Field | TabAsField
  path: string
  operator: string,
  val: any
  hasCustomID: boolean
}

export const sanitizeQueryValue = ({ field, path, operator, val, hasCustomID }: SanitizeQueryValueArgs): unknown => {
  let formattedValue = val;

  // Disregard invalid _ids
  if (path === '_id' && typeof val === 'string' && val.split(',').length === 1) {
    if (!hasCustomID) {
      const isValid = mongoose.Types.ObjectId.isValid(val);

      if (!isValid) {
        return undefined;
      }
    }

    if (field.type === 'number') {
      const parsedNumber = parseFloat(val);

      if (Number.isNaN(parsedNumber)) {
        return undefined;
      }
    }
  }

  // Cast incoming values as proper searchable types
  if (field.type === 'checkbox' && typeof val === 'string') {
    if (val.toLowerCase() === 'true') formattedValue = true;
    if (val.toLowerCase() === 'false') formattedValue = false;
  }

  if (field.type === 'number' && typeof val === 'string') {
    formattedValue = Number(val);
  }

  if (field.type === 'date' && typeof val === 'string') {
    formattedValue = new Date(val);
    if (Number.isNaN(Date.parse(formattedValue))) {
      return undefined;
    }
  }

  if (['relationship', 'upload'].includes(field.type)) {
    if (val === 'null') {
      formattedValue = null;
    }

    if (operator === 'in' && Array.isArray(formattedValue)) {
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
