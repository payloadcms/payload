import React, { memo } from 'react';
import PropTypes from 'prop-types';

import useForm from '../Form/useForm';

const withCondition = (Field) => {
  const WithCondition = memo((props) => {
    const { condition, name } = props;
    const { getFields } = useForm();

    if (condition) {
      const fields = getFields();

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

      const passesCondition = condition ? condition(fields, siblingFields) : true;

      if (passesCondition) {
        return <Field {...props} />;
      }

      return null;
    }

    return <Field {...props} />;
  });

  WithCondition.defaultProps = {
    condition: null,
    name: '',
  };

  WithCondition.propTypes = {
    condition: PropTypes.func,
    name: PropTypes.string,
  };

  return WithCondition;
};

export default withCondition;
