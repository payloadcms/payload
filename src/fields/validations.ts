import defaultRichTextValue from './richText/defaultValue';
import { Validate } from './config/types';

const defaultMessage = 'This field is required.';

export const number: Validate = (value: string, options = {}) => {
  const parsedValue = parseInt(value, 10);

  if ((value && typeof parsedValue !== 'number') || (options.required && Number.isNaN(parsedValue))) {
    return 'Please enter a valid number.';
  }

  if (options.max && parsedValue > options.max) {
    return `"${value}" is greater than the max allowed value of ${options.max}.`;
  }

  if (options.min && parsedValue < options.min) {
    return `"${value}" is less than the min allowed value of ${options.min}.`;
  }

  if (options.required && typeof parsedValue !== 'number') {
    return defaultMessage;
  }

  return true;
};

export const text: Validate = (value: string, options = {}) => {
  if (options.maxLength && (value && value.length > options.maxLength)) {
    return `This value must be shorter than the max length of ${options.maxLength} characters.`;
  }

  if (options.minLength && (value && value.length < options.minLength)) {
    return `This value must be longer than the minimum length of ${options.minLength} characters.`;
  }

  if (options.required) {
    if (typeof value !== 'string' || (typeof value === 'string' && value.length === 0)) {
      return defaultMessage;
    }
  }

  return true;
};

export const password: Validate = (value: string, options = {}) => {
  if (options.maxLength && value.length > options.maxLength) {
    return `This value must be shorter than the max length of ${options.maxLength} characters.`;
  }

  if (options.minLength && value.length < options.minLength) {
    return `This value must be longer than the minimum length of ${options.minLength} characters.`;
  }

  if (options.required && !value) {
    return defaultMessage;
  }

  return true;
};

export const email: Validate = (value: string, options = {}) => {
  if ((value && !/\S+@\S+\.\S+/.test(value))
    || (!value && options.required)) {
    return 'Please enter a valid email address.';
  }

  return true;
};

export const textarea: Validate = (value: string, options = {}) => {
  if (options.maxLength && value.length > options.maxLength) {
    return `This value must be shorter than the max length of ${options.maxLength} characters.`;
  }

  if (options.minLength && value.length < options.minLength) {
    return `This value must be longer than the minimum length of ${options.minLength} characters.`;
  }

  if (options.required && !value) {
    return defaultMessage;
  }

  return true;
};

export const wysiwyg: Validate = (value: string, options = {}) => {
  if (options.required && !value) {
    return defaultMessage;
  }

  return true;
};

export const code: Validate = (value: string, options = {}) => {
  if (options.required && value === undefined) {
    return defaultMessage;
  }

  return true;
};

export const richText: Validate = (value, options = {}) => {
  if (options.required) {
    const stringifiedDefaultValue = JSON.stringify(defaultRichTextValue);
    if (value && JSON.stringify(value) !== stringifiedDefaultValue) return true;
    return 'This field is required.';
  }

  return true;
};

export const checkbox: Validate = (value: boolean, options = {}) => {
  if ((value && typeof value !== 'boolean')
    || (options.required && typeof value !== 'boolean')) {
    return 'This field can only be equal to true or false.';
  }

  return true;
};

export const date: Validate = (value, options = {}) => {
  if (value && !isNaN(Date.parse(value.toString()))) { /* eslint-disable-line */
    return true;
  }

  if (value) {
    return `"${value}" is not a valid date.`;
  }

  if (options.required) {
    return defaultMessage;
  }

  return true;
};

export const upload: Validate = (value: string, options = {}) => {
  if (value || !options.required) return true;
  return defaultMessage;
};

export const relationship: Validate = (value, options = {}) => {
  if (value || !options.required) return true;
  return defaultMessage;
};

export const array: Validate = (value, options = {}) => {
  if (options.minRows && value < options.minRows) {
    return `This field requires at least ${options.minRows} row(s).`;
  }

  if (options.maxRows && value > options.maxRows) {
    return `This field requires no more than ${options.maxRows} row(s).`;
  }

  if (!value && options.required) {
    return 'This field requires at least one row.';
  }

  return true;
};

export const select: Validate = (value, options = {}) => {
  if (Array.isArray(value) && value.find((input) => !options.options.find((option) => (option === input || option.value === input)))) {
    return 'This field has an invalid selection';
  }

  if (typeof value === 'string' && !options.options.find((option) => (option === value || option.value === value))) {
    return 'This field has an invalid selection';
  }

  if (options.required && !value) {
    return defaultMessage;
  }

  return true;
};

export const radio: Validate = (value, options = {}) => {
  const stringValue = String(value);
  if ((typeof value !== 'undefined' || !options.required) && (options.options.find((option) => String(option.value) === stringValue))) return true;
  return defaultMessage;
};

export const blocks: Validate = (value, options = {}) => {
  if (options.minRows && value < options.minRows) {
    return `This field requires at least ${options.minRows} row(s).`;
  }

  if (options.maxRows && value > options.maxRows) {
    return `This field requires no more than ${options.maxRows} row(s).`;
  }

  if (!value && options.required) {
    return 'This field requires at least one row.';
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
};
