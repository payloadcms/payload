const deepCopyObject = (inObject) => {
  if (inObject instanceof Date) return inObject;

  if (inObject instanceof Set) return new Set(inObject);

  if (inObject instanceof Map) return new Map(inObject);

  if (typeof inObject !== 'object' || inObject === null) {
    return inObject; // Return the value if inObject is not an object
  }

  // Create an array or object to hold the values
  const outObject = Array.isArray(inObject) ? [] : {};

  Object.keys(inObject).forEach((key) => {
    const value = inObject[key];

    // Recursively (deep) copy for nested objects, including arrays
    outObject[key] = (typeof value === 'object' && value !== null) ? deepCopyObject(value) : value;
  });

  return outObject;
};

export default deepCopyObject;
