import React from 'react';
import PropTypes from 'prop-types';

import useForm from '../Form/useForm';

const recursiveCheckCondition = (object, siblingFields) => Object.keys(object).every((key) => {
  if (key.toLowerCase() === 'and') {
    return object[key].every((andCondition) => {
      const result = recursiveCheckCondition(andCondition, siblingFields);
      return result;
    });
  }

  if (key.toLowerCase() === 'or') {
    return object[key].some((orCondition) => {
      const result = recursiveCheckCondition(orCondition, siblingFields);
      return result;
    });
  }

  if (typeof object[key] === 'object') {
    return Object.keys(object[key]).every((operator) => {
      const value = siblingFields?.[key]?.value;
      const valueToCompare = object[key][operator];

      let result = false;

      if (operator === 'equals') {
        result = value === valueToCompare;
      }

      if (operator === 'not_equals') {
        result = value !== valueToCompare;
      }

      if (typeof value === 'number') {
        if (operator === 'greater_than') {
          result = value > valueToCompare;
        }

        if (operator === 'greater_than_equals') {
          result = value >= valueToCompare;
        }

        if (operator === 'less_than') {
          result = value < valueToCompare;
        }

        if (operator === 'less_than_equals') {
          result = value <= valueToCompare;
        }
      }

      return result;
    });
  }

  return false;
});

const withConditions = (Field) => {
  const WithConditions = (props) => {
    const { conditions, name } = props;
    const { fields } = useForm();

    if (conditions) {
      let siblingFields = fields;

      // If this field is nested
      // We can provide a list of sibling fields
      if (name.indexOf('.') > 0) {
        const parentFieldPath = name.substring(0, name.lastIndexOf('.') + 1);
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

      const passesConditions = recursiveCheckCondition(conditions, siblingFields);

      if (passesConditions) {
        return <Field {...props} />;
      }

      return null;
    }

    return <Field {...props} />;
  };

  WithConditions.defaultProps = {
    conditions: null,
  };

  WithConditions.propTypes = {
    conditions: PropTypes.oneOfType([
      PropTypes.shape({}),
      PropTypes.array,
    ]),
    name: PropTypes.string.isRequired,
  };

  return WithConditions;
};

export default withConditions;
