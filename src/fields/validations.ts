import defaultRichTextValue from './richText/defaultValue';
import {
  ArrayField,
  BlockField,
  CheckboxField,
  CodeField,
  DateField,
  EmailField,
  NumberField,
  PointField,
  RadioField,
  RelationshipField,
  RelationshipValue,
  RichTextField,
  SelectField,
  TextareaField,
  TextField,
  UploadField,
  Validate,
} from './config/types';
import { TypeWithID } from '../collections/config/types';
import canUseDOM from '../utilities/canUseDOM';

const defaultMessage = 'This field is required.';

export const number: Validate<unknown, unknown, NumberField> = (value: string, { required, min, max }) => {
  const parsedValue = parseFloat(value);

  if ((value && typeof parsedValue !== 'number') || (required && Number.isNaN(parsedValue)) || (value && Number.isNaN(parsedValue))) {
    return 'Please enter a valid number.';
  }

  if (typeof max === 'number' && parsedValue > max) {
    return `"${value}" is greater than the max allowed value of ${max}.`;
  }

  if (typeof min === 'number' && parsedValue < min) {
    return `"${value}" is less than the min allowed value of ${min}.`;
  }

  if (required && typeof parsedValue !== 'number') {
    return defaultMessage;
  }

  return true;
};

export const text: Validate<unknown, unknown, TextField> = (value: string, { minLength, maxLength, required }) => {
  if (value && maxLength && value.length > maxLength) {
    return `This value must be shorter than the max length of ${maxLength} characters.`;
  }

  if (value && minLength && value?.length < minLength) {
    return `This value must be longer than the minimum length of ${minLength} characters.`;
  }

  if (required) {
    if (typeof value !== 'string' || value?.length === 0) {
      return defaultMessage;
    }
  }

  return true;
};

export const password: Validate<unknown, unknown, TextField> = (value: string, { required, maxLength, minLength }) => {
  if (value && maxLength && value.length > maxLength) {
    return `This value must be shorter than the max length of ${maxLength} characters.`;
  }

  if (value && minLength && value.length < minLength) {
    return `This value must be longer than the minimum length of ${minLength} characters.`;
  }

  if (required && !value) {
    return defaultMessage;
  }

  return true;
};

export const email: Validate<unknown, unknown, EmailField> = (value: string, { required }) => {
  if ((value && !/\S+@\S+\.\S+/.test(value))
    || (!value && required)) {
    return 'Please enter a valid email address.';
  }

  return true;
};

export const textarea: Validate<unknown, unknown, TextareaField> = (value: string, {
  required,
  maxLength,
  minLength,
}) => {
  if (value && maxLength && value.length > maxLength) {
    return `This value must be shorter than the max length of ${maxLength} characters.`;
  }

  if (value && minLength && value.length < minLength) {
    return `This value must be longer than the minimum length of ${minLength} characters.`;
  }

  if (required && !value) {
    return defaultMessage;
  }

  return true;
};

export const code: Validate<unknown, unknown, CodeField> = (value: string, { required }) => {
  if (required && value === undefined) {
    return defaultMessage;
  }

  return true;
};

export const richText: Validate<unknown, unknown, RichTextField> = (value, { required }) => {
  if (required) {
    const stringifiedDefaultValue = JSON.stringify(defaultRichTextValue);
    if (value && JSON.stringify(value) !== stringifiedDefaultValue) return true;
    return 'This field is required.';
  }

  return true;
};

export const checkbox: Validate<unknown, unknown, CheckboxField> = (value: boolean, { required }) => {
  if ((value && typeof value !== 'boolean')
    || (required && typeof value !== 'boolean')) {
    return 'This field can only be equal to true or false.';
  }

  return true;
};

export const date: Validate<unknown, unknown, DateField> = (value, { required }) => {
  if (value && !isNaN(Date.parse(value.toString()))) { /* eslint-disable-line */
    return true;
  }

  if (value) {
    return `"${value}" is not a valid date.`;
  }

  if (required) {
    return defaultMessage;
  }

  return true;
};

const validateFilterOptions: Validate = async (value, { filterOptions, id, user, data, siblingData, relationTo, payload }) => {
  if (!canUseDOM && typeof filterOptions !== 'undefined' && value) {
    const options: {
      [collection: string]: (string | number)[]
    } = {};

    const collections = typeof relationTo === 'string' ? [relationTo] : relationTo;
    const values = Array.isArray(value) ? value : [value];

    await Promise.all(collections.map(async (collection) => {
      const optionFilter = typeof filterOptions === 'function' ? filterOptions({
        id,
        data,
        siblingData,
        user,
        relationTo: collection,
      }) : filterOptions;

      const valueIDs: (string | number)[] = [];

      values.forEach((val) => {
        if (typeof val === 'object' && val?.value) {
          valueIDs.push(val.value);
        }

        if (typeof val === 'string' || typeof val === 'number') {
          valueIDs.push(val);
        }
      });

      const result = await payload.find<TypeWithID>({
        collection,
        depth: 0,
        where: {
          and: [
            { id: { in: valueIDs } },
            optionFilter,
          ],
        },
      });

      options[collection] = result.docs.map((doc) => doc.id);
    }));

    const invalidRelationships = values.filter((val) => {
      let collection: string;
      let requestedID: string | number;

      if (typeof relationTo === 'string') {
        collection = relationTo;

        if (typeof val === 'string' || typeof val === 'number') {
          requestedID = val;
        }
      }

      if (Array.isArray(relationTo) && typeof val === 'object' && val?.relationTo) {
        collection = val.relationTo;
        requestedID = val.value;
      }

      return options[collection].indexOf(requestedID) === -1;
    });

    if (invalidRelationships.length > 0) {
      return invalidRelationships.reduce((err, invalid, i) => {
        return `${err} ${JSON.stringify(invalid)}${invalidRelationships.length === i + 1 ? ',' : ''} `;
      }, 'This field has the following invalid selections:') as string;
    }

    return true;
  }

  return true;
};

export const upload: Validate<unknown, unknown, UploadField> = (value: string, options) => {
  if (!value && options.required) {
    return defaultMessage;
  }

  return validateFilterOptions(value, options);
};

export const relationship: Validate<unknown, unknown, RelationshipField> = async (value: RelationshipValue, options) => {
  if ((!value || (Array.isArray(value) && value.length === 0)) && options.required) {
    return defaultMessage;
  }

  return validateFilterOptions(value, options);
};

export const array: Validate<unknown, unknown, ArrayField> = (value, { minRows, maxRows, required }) => {
  if (minRows && value < minRows) {
    return `This field requires at least ${minRows} row(s).`;
  }

  if (maxRows && value > maxRows) {
    return `This field requires no more than ${maxRows} row(s).`;
  }

  if (!value && required) {
    return 'This field requires at least one row.';
  }

  return true;
};

export const select: Validate<unknown, unknown, SelectField> = (value, { options, hasMany, required }) => {
  if (Array.isArray(value) && value.some((input) => !options.some((option) => (option === input || (typeof option !== 'string' && option?.value === input))))) {
    return 'This field has an invalid selection';
  }

  if (typeof value === 'string' && !options.some((option) => (option === value || (typeof option !== 'string' && option.value === value)))) {
    return 'This field has an invalid selection';
  }

  if (required && (
    (typeof value === 'undefined' || value === null) || (hasMany && Array.isArray(value) && (value as [])?.length === 0))
  ) {
    return defaultMessage;
  }

  return true;
};

export const radio: Validate<unknown, unknown, RadioField> = (value, { options, required }) => {
  const stringValue = String(value);
  if ((typeof value !== 'undefined' || !required) && (options.find((option) => String(typeof option !== 'string' && option?.value) === stringValue))) return true;
  return defaultMessage;
};

export const blocks: Validate<unknown, unknown, BlockField> = (value, { maxRows, minRows, required }) => {
  if (minRows && value < minRows) {
    return `This field requires at least ${minRows} row(s).`;
  }

  if (maxRows && value > maxRows) {
    return `This field requires no more than ${maxRows} row(s).`;
  }

  if (!value && required) {
    return 'This field requires at least one row.';
  }

  return true;
};

export const point: Validate<unknown, unknown, PointField> = (value: [number | string, number | string] = ['', ''], { required }) => {
  const lng = parseFloat(String(value[0]));
  const lat = parseFloat(String(value[1]));
  if (required && (
    (value[0] && value[1] && typeof lng !== 'number' && typeof lat !== 'number')
    || (Number.isNaN(lng) || Number.isNaN(lat))
    || (Array.isArray(value) && value.length !== 2)
  )) {
    return 'This field requires two numbers';
  }

  if ((value[1] && Number.isNaN(lng)) || (value[0] && Number.isNaN(lat))) {
    return 'This field has an invalid input';
  }

  return true;
};

export default {
  number,
  text,
  password,
  email,
  textarea,
  code,
  richText,
  checkbox,
  date,
  upload,
  relationship,
  array,
  select,
  radio,
  blocks,
  point,
};
