import reduceFieldsToValues from './reduceFieldsToValues';

const getSiblingData = (fields, path) => {
  let siblingFields = fields;

  // If this field is nested
  // We can provide a list of sibling fields
  if (path.indexOf('.') > 0) {
    const parentFieldPath = path.substring(0, path.lastIndexOf('.') + 1);
    siblingFields = Object.keys(fields).reduce((siblings, fieldKey) => {
      if (fieldKey.indexOf(parentFieldPath) === 0) {
        return {
          ...siblings,
          [fieldKey.replace(parentFieldPath, '')]: fields[fieldKey],
        };
      }

      return siblings;
    }, {});
  }

  return reduceFieldsToValues(siblingFields, true);
};

export default getSiblingData;
