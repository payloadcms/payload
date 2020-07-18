import React from 'react';
import PropTypes from 'prop-types';

import { useFormFields } from '../Form/context';

const withCondition = (Field) => {
  const CheckForCondition = (props) => {
    const {
      admin: {
        condition,
      } = {},
    } = props;

    if (condition) {
      return <WithCondition {...props} />;
    }

    return <Field {...props} />;
  };

  CheckForCondition.defaultProps = {
    admin: undefined,
    name: '',
    path: '',
  };

  CheckForCondition.propTypes = {
    admin: PropTypes.shape({
      condition: PropTypes.func,
    }),
    name: PropTypes.string,
    path: PropTypes.string,
  };

  const WithCondition = (props) => {
    const {
      name,
      path,
      admin: {
        condition,
      } = {},
    } = props;

    const { getData, getSiblingData } = useFormFields();

    const data = getData();
    const siblingData = getSiblingData(path || name);
    const passesCondition = condition ? condition(data, siblingData) : true;

    if (passesCondition) {
      return <Field {...props} />;
    }

    return null;
  };

  WithCondition.defaultProps = {
    admin: undefined,
    name: '',
    path: '',
  };

  WithCondition.propTypes = {
    admin: PropTypes.shape({
      condition: PropTypes.func,
    }),
    name: PropTypes.string,
    path: PropTypes.string,
  };

  return CheckForCondition;
};

export default withCondition;
