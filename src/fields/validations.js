const defaultMessage = 'This field is required.';

const optionsToValidatorMap = {
  number: (value, options = {}) => {
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
  },
  text: (value, options = {}) => {
    if (options.maxLength && (value && value.length > options.maxLength)) {
      return `This value must be shorter than the max length of ${options.max} characters.`;
    }

    if (options.minLength && (value && value.length < options.minLength)) {
      return `This value must be longer than the minimum length of ${options.max} characters.`;
    }

    if (options.required) {
      if (typeof value !== 'string' || (typeof value === 'string' && value.length === 0)) {
        return defaultMessage;
      }
    }

    return true;
  },
  password: (value, options = {}) => {
    if (options.maxLength && value.length > options.maxLength) {
      return `This value must be shorter than the max length of ${options.max} characters.`;
    }

    if (options.minLength && value.length < options.minLength) {
      return `This value must be longer than the minimum length of ${options.max} characters.`;
    }

    if (options.required && !value) {
      return defaultMessage;
    }

    return true;
  },
  email: (value, options = {}) => {
    if ((value && !/\S+@\S+\.\S+/.test(value))
      || (!value && options.required)) {
      return 'Please enter a valid email address.';
    }

    return true;
  },
  textarea: (value, options = {}) => {
    if (options.maxLength && value.length > options.maxLength) {
      return `This value must be shorter than the max length of ${options.max} characters.`;
    }

    if (options.minLength && value.length < options.minLength) {
      return `This value must be longer than the minimum length of ${options.max} characters.`;
    }

    if (options.required && !value) {
      return defaultMessage;
    }

    return true;
  },
  wysiwyg: (value, options = {}) => {
    if (options.required && !value) {
      return defaultMessage;
    }

    return true;
  },
  code: (value, options = {}) => {
    if (options.required && value === undefined) {
      return defaultMessage;
    }

    return true;
  },
  richText: (value, options) => {
    //! Need better way to share an empty text node
    //! it is used here and in field-types/RichText
    const emptyRichTextNode = [{
      children: [{ text: '' }],
    }];

    if (options.required) {
      const blankSlateJSNode = JSON.stringify(emptyRichTextNode);
      if (value && JSON.stringify(value) !== blankSlateJSNode) return true;
      return 'This field is required.';
    }

    return true;
  },
  checkbox: (value, options = {}) => {
    if ((value && typeof value !== 'boolean')
      || (options.required && typeof value !== 'boolean')) {
      return 'This field can only be equal to true or false.';
    }

    return true;
  },
  date: (value, options = {}) => {
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
  },
  upload: (value, options = {}) => {
    if (value || !options.required) return true;
    return defaultMessage;
  },
  relationship: (value, options = {}) => {
    if (value || !options.required) return true;
    return defaultMessage;
  },
  array: (value, options = {}) => {
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
  },
  select: (value, options = {}) => {
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
  },
  radio: (value, options = {}) => {
    const stringValue = String(value);
    if ((value || !options.required) && (options.options.find((option) => String(option.value) === stringValue))) return true;
    return defaultMessage;
  },
  blocks: (value, options) => {
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
  },
};

module.exports = optionsToValidatorMap;
