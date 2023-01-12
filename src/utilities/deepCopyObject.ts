import { isPlainObject } from 'is-plain-object';

const deepCopyObject = (inObject) => {
  if (inObject instanceof Date) return inObject;

  if (typeof inObject !== 'object' || inObject === null) {
    return inObject; // Return the value if inObject is not an object
  }

  const isArray = Array.isArray(inObject);

  if (isPlainObject(inObject) || isArray) {
    // Create an array or object to hold the values
    const outObject = isArray ? [] : {};

    Object.keys(inObject).forEach((key) => {
      const value = inObject[key];

      // Recursively (deep) copy for nested objects, including arrays
      outObject[key] = (typeof value === 'object' && value !== null) ? deepCopyObject(value) : value;
    });

    return outObject;
  }
  return inObject;
};

export default deepCopyObject;
