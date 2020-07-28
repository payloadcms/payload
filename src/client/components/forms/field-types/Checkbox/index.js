import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Error from '../../Error';
import { checkbox } from '../../../../../fields/validations';
import Check from '../../../icons/Check';

import './index.scss';

const baseClass = 'checkbox';

const Checkbox = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate,
    label,
    onChange,
    disableFormData,
    admin: {
      readOnly,
      style,
      width,
    } = {},
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const {
    value,
    showError,
    errorMessage,
    setValue,
  } = useFieldType({
    path,
    required,
    validate: memoizedValidate,
    disableFormData,
  });

  const classes = [
    'field-type',
    baseClass,
    showError && 'error',
    value && `${baseClass}--checked`,
    readOnly && `${baseClass}--read-only`,
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
        onClick={readOnly ? undefined : () => {
          setValue(!value);
          if (typeof onChange === 'function') onChange(!value);
        }}
      >
        <span className={`${baseClass}__input`}>
          <Check />
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
  admin: {},
  validate: checkbox,
  path: '',
  onChange: undefined,
  disableFormData: false,
};

Checkbox.propTypes = {
  path: PropTypes.string,
  name: PropTypes.string.isRequired,
  admin: PropTypes.shape({
    readOnly: PropTypes.bool,
    style: PropTypes.shape({}),
    width: PropTypes.string,
  }),
  required: PropTypes.bool,
  validate: PropTypes.func,
  label: PropTypes.string,
  onChange: PropTypes.func,
  disableFormData: PropTypes.bool,
};

export default withCondition(Checkbox);
