import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Error from '../../Error';
import { checkbox } from '../../../../../fields/validations';
import X from '../../../icons/X';

import './index.scss';

const baseClass = 'checkbox';

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
    onChange,
    disableFormData,
  } = props;

  const path = pathFromProps || name;

  const {
    value,
    showError,
    errorMessage,
    setValue,
  } = useFieldType({
    path,
    required,
    initialData,
    defaultValue,
    validate,
    disableFormData,
  });

  const classes = [
    'field-type',
    baseClass,
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
      <input
        type="checkbox"
        name={path}
        id={path}
        checked={value ? 'on' : false}
        readOnly
      />
      <button
        type="button"
        onClick={() => setValue(!value)}
      >
        <span className={`${baseClass}__input`}>
          {value && <X />}
        </span>
        <span className={`${baseClass}__label`}>
          {label}
        </span>
      </button>
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
  onChange: undefined,
  disableFormData: false,
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
  onChange: PropTypes.func,
  disableFormData: PropTypes.bool,
};

export default withCondition(Checkbox);
