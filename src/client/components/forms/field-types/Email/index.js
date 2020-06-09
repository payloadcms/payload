import React, {
  useRef, useState, useEffect, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import withCondition from '../../withCondition';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import { email } from '../../../../../fields/validations';

import './index.scss';

const Email = (props) => {
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
    placeholder,
    autoComplete,
    readOnly,
  } = props;

  const path = pathFromProps || name;

  const ref = useRef(null);
  const [autofilled, setAutofilled] = useState(null);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useFieldType({
    path,
    required,
    initialData,
    defaultValue,
    validate,
  });

  const classes = [
    'field-type',
    'email',
    showError && 'error',
    readOnly && 'read-only',
  ].filter(Boolean).join(' ');

  const autofillListener = useCallback((e) => {
    switch (e?.animationName) {
      case 'onAutoFillStart':
        return setAutofilled(true);

      default:
        return setAutofilled(false);
    }
  }, []);

  useEffect(() => {
    const input = ref.current;
    input.addEventListener('animationstart', autofillListener);

    return () => input.removeEventListener('animationstart', autofillListener);
  }, [autofillListener]);

  useEffect(() => {
    if (autofilled) {
      setValue(value);
    }
  }, [autofilled, value, setValue]);

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
      <Label
        htmlFor={path}
        label={label}
        required={required}
      />
      <input
        value={value || ''}
        onChange={setValue}
        disabled={readOnly ? 'disabled' : undefined}
        placeholder={placeholder}
        type="email"
        id={path}
        name={path}
        autoComplete={autoComplete}
        ref={ref}
      />
    </div>
  );
};

Email.defaultProps = {
  label: null,
  required: false,
  defaultValue: undefined,
  initialData: undefined,
  placeholder: undefined,
  width: undefined,
  style: {},
  autoComplete: undefined,
  validate: email,
  path: '',
  readOnly: false,
};

Email.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  initialData: PropTypes.string,
  validate: PropTypes.func,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string,
  autoComplete: PropTypes.string,
  readOnly: PropTypes.bool,
};

export default withCondition(Email);
