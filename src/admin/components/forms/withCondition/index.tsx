import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { useWatchForm } from '../Form/context';

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
      path: pathFromProps,
      admin: {
        condition,
      } = {},
    } = props;

    const path = pathFromProps || name;

    const { getData, getSiblingData, getField, dispatchFields } = useWatchForm();

    const data = getData();
    const field = getField(path);
    const siblingData = getSiblingData(path);
    const passesCondition = condition ? condition(data, siblingData) : true;
    const fieldExists = Boolean(field);

    useEffect(() => {
      if (!passesCondition && fieldExists) {
        dispatchFields({ type: 'REMOVE', path });
      }
    }, [dispatchFields, passesCondition, path, fieldExists]);

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
