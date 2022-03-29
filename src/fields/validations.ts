import defaultRichTextValue from './richText/defaultValue';
import {
  ArrayField, BlockField,
  CheckboxField,
  CodeField, DateField,
  EmailField,
  NumberField, PointField, RadioField, RelationshipField,
  RichTextField, SelectField,
  TextareaField,
  TextField, UploadField,
  Validate,
} from './config/types';

const defaultMessage = 'This field is required.';

export const number: Validate<unknown, unknown, NumberField> = (value: string, options) => {
  const parsedValue = parseInt(value, 10);

  if ((value && typeof parsedValue !== 'number') || (options.field.required && Number.isNaN(parsedValue))) {
    return 'Please enter a valid number.';
  }

  if (options.field.max && parsedValue > options.field.max) {
    return `"${value}" is greater than the max allowed value of ${options.field.max}.`;
  }

  if (options.field.min && parsedValue < options.field.min) {
    return `"${value}" is less than the min allowed value of ${options.field.min}.`;
  }

  if (options.field.required && typeof parsedValue !== 'number') {
    return defaultMessage;
  }

  return true;
};

export const text: Validate<unknown, unknown, TextField> = (value: string, options) => {
  if (value && options.field.maxLength && value.length > options.field.maxLength) {
    return `This value must be shorter than the max length of ${options.field.maxLength} characters.`;
  }

  if (value && options.field.minLength && value?.length < options.field.minLength) {
    return `This value must be longer than the minimum length of ${options.field.minLength} characters.`;
  }

  if (options.field.required) {
    if (typeof value !== 'string' || value?.length === 0) {
      return defaultMessage;
    }
  }

  return true;
};

export const password: Validate<unknown, unknown, TextField> = (value: string, options) => {
  if (value && options.field.maxLength && value.length > options.field.maxLength) {
    return `This value must be shorter than the max length of ${options.field.maxLength} characters.`;
  }

  if (value && options.field.minLength && value.length < options.field.minLength) {
    return `This value must be longer than the minimum length of ${options.field.minLength} characters.`;
  }

  if (options.field.required && !value) {
    return defaultMessage;
  }

  return true;
};

export const email: Validate<unknown, unknown, EmailField> = (value: string, options) => {
  if ((value && !/\S+@\S+\.\S+/.test(value))
    || (!value && options.field.required)) {
    return 'Please enter a valid email address.';
  }

  return true;
};

export const textarea: Validate<unknown, unknown, TextareaField> = (value: string, options) => {
  if (value && options.field.maxLength && value.length > options.field.maxLength) {
    return `This value must be shorter than the max length of ${options.field.maxLength} characters.`;
  }

  if (value && options.field.minLength && value.length < options.field.minLength) {
    return `This value must be longer than the minimum length of ${options.field.minLength} characters.`;
  }

  if (options.field.required && !value) {
    return defaultMessage;
  }

  return true;
};

export const wysiwyg: Validate<unknown, unknown, TextareaField> = (value: string, options) => {
  if (options.field.required && !value) {
    return defaultMessage;
  }

  return true;
};

export const code: Validate<unknown, unknown, CodeField> = (value: string, options) => {
  if (options.field.required && value === undefined) {
    return defaultMessage;
  }

  return true;
};

export const richText: Validate<unknown, unknown, RichTextField> = (value, options) => {
  if (options.field.required) {
    const stringifiedDefaultValue = JSON.stringify(defaultRichTextValue);
    if (value && JSON.stringify(value) !== stringifiedDefaultValue) return true;
    return 'This field is required.';
  }

  return true;
};

export const checkbox: Validate<unknown, unknown, CheckboxField> = (value: boolean, options) => {
  if ((value && typeof value !== 'boolean')
    || (options.field.required && typeof value !== 'boolean')) {
    return 'This field can only be equal to true or false.';
  }

  return true;
};

export const date: Validate<unknown, unknown, DateField> = (value, options) => {
  if (value && !isNaN(Date.parse(value.toString()))) { /* eslint-disable-line */
    return true;
  }

  if (value) {
    return `"${value}" is not a valid date.`;
  }

  if (options.field.required) {
    return defaultMessage;
  }

  return true;
};

export const upload: Validate<unknown, unknown, UploadField> = (value: string, options) => {
  if (value || !options.field.required) return true;
  return defaultMessage;
};

export const relationship: Validate<unknown, unknown, RelationshipField> = (value, options) => {
  if (value || !options.field.required) return true;
  return defaultMessage;
};

export const array: Validate<unknown, unknown, ArrayField> = (value, options) => {
  if (options.field.minRows && value < options.field.minRows) {
    return `This field requires at least ${options.field.minRows} row(s).`;
  }

  if (options.field.maxRows && value > options.field.maxRows) {
    return `This field requires no more than ${options.field.maxRows} row(s).`;
  }

  if (!value && options.field.required) {
    return 'This field requires at least one row.';
  }

  return true;
};

export const select: Validate<unknown, unknown, SelectField> = (value, options) => {
  if (Array.isArray(value) && value.some((input) => !options.field.options.some((option) => (option === input || (typeof option !== 'string' && option?.value === input))))) {
    return 'This field has an invalid selection';
  }

  if (typeof value === 'string' && !options.field.options.some((option) => (option === value || (typeof option !== 'string' && option.value === value)))) {
    return 'This field has an invalid selection';
  }

  if (options.field.required && (
    (typeof value === 'undefined' || value === null) || (options.field.hasMany && Array.isArray(value) && (value as [])?.length === 0))
  ) {
    return defaultMessage;
  }

  return true;
};

export const radio: Validate<unknown, unknown, RadioField> = (value, options) => {
  const stringValue = String(value);
  if ((typeof value !== 'undefined' || !options.field.required) && (options.field.options.find((option) => String(typeof option !== 'string' && option?.value) === stringValue))) return true;
  return defaultMessage;
};

export const blocks: Validate<unknown, unknown, BlockField> = (value, options) => {
  if (options.field.minRows && value < options.field.minRows) {
    return `This field requires at least ${options.field.minRows} row(s).`;
  }

  if (options.field.maxRows && value > options.field.maxRows) {
    return `This field requires no more than ${options.field.maxRows} row(s).`;
  }

  if (!value && options.field.required) {
    return 'This field requires at least one row.';
  }

  return true;
};

export const point: Validate<unknown, unknown, PointField> = (value: [number | string, number | string] = ['', ''], options) => {
  const lng = parseFloat(String(value[0]));
  const lat = parseFloat(String(value[1]));
  if (
    (value[0] && value[1] && typeof lng !== 'number' && typeof lat !== 'number')
    || (options.field.required && (Number.isNaN(lng) || Number.isNaN(lat)))
    || (Array.isArray(value) && value.length !== 2)
  ) {
    return 'This field requires two numbers';
  }

  if (!options.field.required && typeof value[0] !== typeof value[1]) {
    return 'This field requires two numbers or both can be empty';
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
  wysiwyg,
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
