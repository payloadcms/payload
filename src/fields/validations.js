const fieldToValidatorMap = {
  number: (field, value) => {
    const parsedValue = parseInt(value, 10);

    if (typeof parsedValue !== 'number') return false;
    if (field.max && parsedValue > field.max) return false;
    if (field.min && parsedValue < field.min) return false;

    return true;
  },
  text: (field, value) => {
    if (field.maxLength && value.length > field.maxLength) return false;
    if (field.minLength && value.length < field.minLength) return false;

    return true;
  },
  email: value => /\S+@\S+\.\S+/.test(value),
  textarea: (field, value) => {
    if (field.maxLength && value.length > field.maxLength) return false;
    if (field.minLength && value.length < field.minLength) return false;

    return true;
  },
  wysiwyg: value => (!!value),
  code: value => (!!value),
  checkbox: value => Boolean(value),
  date: value => value instanceof Date,
  upload: value => (!!value),
  relationship: value => (!!value),
  repeater: value => (!!value),
  select: value => (!!value),
  flexible: value => (!!value),
};

module.exports = fieldToValidatorMap;
