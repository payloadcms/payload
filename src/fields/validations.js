const optionsToValidatorMap = {
  number: (value, options = {}) => {
    const parsedValue = parseInt(value, 10);

    if (typeof parsedValue !== 'number' || Number.isNaN(parsedValue)) {
      return 'Please enter a valid number.';
    }

    if (options.max && parsedValue > options.max) {
      return `"${value}" is greater than the max allowed value of ${options.max}.`;
    }

    if (options.min && parsedValue < options.min) {
      return `"${value}" is less than the min allowed value of ${options.min}.`;
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

    if (typeof value !== 'string' || (typeof value === 'string' && value.length === 0)) {
      return 'This field is required.';
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

    return Boolean(value);
  },
  email: (value) => {
    if (/\S+@\S+\.\S+/.test(value)) {
      return true;
    }
    return 'Please enter a valid email address.';
  },
  textarea: (value, options = {}) => {
    if (options.maxLength && value.length > options.maxLength) {
      return `This value must be shorter than the max length of ${options.max} characters.`;
    }

    if (options.minLength && value.length < options.minLength) {
      return `This value must be longer than the minimum length of ${options.max} characters.`;
    }

    return Boolean(value);
  },
  wysiwyg: (value) => {
    if (value) return true;

    return 'This field is required.';
  },
  code: (value) => {
    if (value) return true;

    return 'This field is required.';
  },
  checkbox: (value) => {
    if (typeof value === 'boolean') {
      return true;
    }

    return 'This field can only be equal to true or false.';
  },
  date: (value) => {
    if (value instanceof Date) {
      return true;
    }

    return `"${value}" is not a valid date.`;
  },
  upload: (value) => {
    if (value) return true;
    return 'This field is required.';
  },
  relationship: (value) => {
    if (value) return true;
    return 'This field is required.';
  },
  repeater: (value, options = {}) => {
    if (options.minRows && value < options.minRows) {
      return `This field requires at least ${options.minRows} row(s).`;
    }

    if (options.maxRows && value > options.maxRows) {
      return `This field requires no more than ${options.maxRows} row(s).`;
    }

    if (!value) {
      return 'This field requires at least one row.';
    }

    return true;
  },
  select: (value) => {
    if (value && value.length > 0) return true;
    return 'This field is required.';
  },
  radio: (value) => {
    if (value) return true;
    return 'This field is required.';
  },
  flexible: (value, options) => {
    if (options.minRows && value < options.minRows) {
      return `This field requires at least ${options.minRows} row(s).`;
    }

    if (options.maxRows && value > options.maxRows) {
      return `This field requires no more than ${options.maxRows} row(s).`;
    }

    if (!value) {
      return 'This field requires at least one row.';
    }

    return true;
  },
};

module.exports = optionsToValidatorMap;
