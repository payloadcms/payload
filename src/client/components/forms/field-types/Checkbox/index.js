import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Error from '../../Error';
import StyledCheckbox from './StyledCheckbox';
import { checkbox } from '../../../../../fields/validations';

import './index.scss';

const Checkbox = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    defaultValue,
    initialData,
    validate,
    style,
    width,
    label,
    readOnly,
  } = props;

  const path = pathFromProps || name;

  const {
    value,
    showError,
    errorMessage,
    setValue,
    formProcessing,
  } = useFieldType({
    path,
    required,
    initialData,
    defaultValue,
    validate,
  });

  const classes = [
    'field-type',
    'checkbox',
    showError && 'error',
    readOnly && 'read-only',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <Error
        showError={showError}
        message={errorMessage}
      />
      <StyledCheckbox
        onClick={setValue}
        isChecked={value || false}
        name={path}
        label={label}
        isDisabled={formProcessing || readOnly}
        hasError={showError}
      />
      {label}
    </div>
  );
};

Checkbox.defaultProps = {
  label: null,
  required: false,
  readOnly: false,
  defaultValue: false,
  initialData: false,
  validate: checkbox,
  width: undefined,
  style: {},
  path: '',
};

Checkbox.propTypes = {
  path: PropTypes.string,
  name: PropTypes.string.isRequired,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  defaultValue: PropTypes.bool,
  initialData: PropTypes.bool,
  validate: PropTypes.func,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string,
};

export default withCondition(Checkbox);
