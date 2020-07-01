import React from 'react';
import PropTypes from 'prop-types';

import useForm from '../Form/useForm';

const withCondition = (Field) => {
  const CheckForCondition = (props) => {
    const { condition } = props;

    if (condition) {
      return <WithCondition {...props} />;
    }

    return <Field {...props} />;
  };

  CheckForCondition.defaultProps = {
    condition: null,
    name: '',
    path: '',
  };

  CheckForCondition.propTypes = {
    condition: PropTypes.func,
    name: PropTypes.string,
    path: PropTypes.string,
  };

  const WithCondition = (props) => {
    const { condition, name, path } = props;
    const { getData, getSiblingData } = useForm();

    const fields = getData();
    const siblingFields = getSiblingData(path || name);
    const passesCondition = condition ? condition(fields, siblingFields) : true;

    if (passesCondition) {
      return <Field {...props} />;
    }

    return null;
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

  return CheckForCondition;
};

export default withCondition;
