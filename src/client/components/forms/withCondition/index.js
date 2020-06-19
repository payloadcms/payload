import React from 'react';
import PropTypes from 'prop-types';

import useForm from '../Form/useForm';

const withCondition = (Field) => {
  const WithCondition = (props) => {
    const { condition, name, path } = props;
    const { getData, getSiblingData } = useForm();

    if (condition) {
      const fields = getData();
      const siblingFields = getSiblingData(path || name);
      const passesCondition = condition ? condition(fields, siblingFields) : true;

      if (passesCondition) {
        return <Field {...props} />;
      }

      return null;
    }

    return <Field {...props} />;
  };

  WithCondition.defaultProps = {
    condition: null,
    name: '',
    path: '',
  };

  WithCondition.propTypes = {
    condition: PropTypes.func,
    name: PropTypes.string,
    path: PropTypes.string,
  };

  return WithCondition;
};

export default withCondition;
