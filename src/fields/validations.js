const fieldToValidatorMap = {
  number: (value, field) => {
    const parsedValue = parseInt(value, 10);

    if (typeof parsedValue !== 'number' || Number.isNaN(parsedValue)) {
      return `${field.label} value is not a valid number.`;
    }

    if (field.max && parsedValue > field.max) {
      return `${field.label} value is greater than the max allowed value of ${field.max}.`;
    }

    if (field.min && parsedValue < field.min) {
      return `${field.label} value is less than the min allowed value of ${field.min}.`;
    }

    return true;
  },
  text: (value, field) => {
    if (field.maxLength && value.length > field.maxLength) {
      return `${field.label} length is greater than the max allowed length of ${field.maxLength}.`;
    }

    if (field.minLength && value.length < field.minLength) {
      return `${field.label} length is less than the minimum allowed length of ${field.minLength}.`;
    }

    return true;
  },
  email: (value, field) => {
    if (/\S+@\S+\.\S+/.test(value)) {
      return true;
    }
    return `${field.label} is not a valid email address.`;
  },
  textarea: (value, field) => {
    if (field.maxLength && value.length > field.maxLength) {
      return `${field.label} length is greater than the max allowed length of ${field.maxLength}.`;
    }

    if (field.minLength && value.length < field.minLength) {
      return `${field.label} length is less than the minimum allowed length of ${field.minLength}.`;
    }

    return true;
  },
  wysiwyg: (value, field) => {
    if (value) return true;

    return `${field.label} is required.`;
  },
  code: (value, field) => {
    if (value) return true;

    return `${field.label} is required.`;
  },
  checkbox: (value, field) => {
    if (value) {
      return true;
    }

    return `${field.label} can only be equal to true or false.`;
  },
  date: (value, field) => {
    if (value instanceof Date) {
      return true;
    }

    return `${field.label} is not a valid date.`;
  },
  upload: (value, field) => {
    if (value) return true;
    return `${field.label} is required.`;
  },
  relationship: (value, field) => {
    if (value) return true;
    return `${field.label} is required.`;
  },
  repeater: (value, field) => {
    if (value) return true;
    return `${field.label} is required.`;
  },
  select: (value, field) => {
    if (value) return true;
    return `${field.label} is required.`;
  },
  flexible: (value, field) => {
    if (value) return true;
    return `${field.label} is required.`;
  },
};

module.exports = fieldToValidatorMap;
