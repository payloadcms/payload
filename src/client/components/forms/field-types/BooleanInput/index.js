import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';

const defaultValidate = value => value.length > 0;

const BooleanInput = (props) => {
  const {
    name,
    required,
    defaultValue,
    validate,
    style,
    width,
    errorMessage,
    label,
  } = props;

  const {
    value,
    showError,
    processing,
    onFieldChange,
  } = useFieldType({
    name,
    required,
    defaultValue,
    validate,
  });

  const fieldWidth = width ? `${width}%` : null;

  return (
    <div
      className="field-type password"
      style={{
        ...style,
        width: fieldWidth,
      }}
    >
      <input
        value={value || ''}
        onChange={onFieldChange}
        disabled={processing ? 'disabled' : undefined}
        type="password"
        id={name}
        name={name}
      />
    </div>
  );
};

BooleanInput.defaultProps = {};

BooleanInput.propTypes = {};

export default BooleanInput;
