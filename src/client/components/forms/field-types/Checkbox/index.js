import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Error from '../../Error';
import StyledCheckbox from './StyledCheckbox';

import './index.scss';

const Checkbox = (props) => {
  const {
    name,
    required,
    defaultValue,
    validate,
    style,
    width,
    label,
  } = props;

  const {
    value,
    showError,
    errorMessage,
    onFieldChange,
    formProcessing,
  } = useFieldType({
    name,
    required,
    defaultValue,
    validate,
  });

  const classes = [
    'field-type',
    'checkbox',
    showError && 'error',
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
        onClick={onFieldChange}
        isChecked={value || false}
        name={name}
        label={label}
        isDisabled={formProcessing}
        hasError={showError}
      />
      {label}
    </div>
  );
};

Checkbox.defaultProps = {
  label: null,
  required: false,
  defaultValue: false,
  validate: null,
  width: undefined,
  style: {},
};

Checkbox.propTypes = {
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  defaultValue: PropTypes.bool,
  validate: PropTypes.func,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string,
};

export default withCondition(Checkbox);
