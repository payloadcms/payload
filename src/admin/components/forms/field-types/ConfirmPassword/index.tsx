import React, { useCallback } from 'react';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import { useWatchForm } from '../../Form/context';

import './index.scss';

const ConfirmPassword: React.FC = () => {
  const { getField } = useWatchForm();
  const password = getField('password');

  const validate = useCallback((value) => {
    if (value === password?.value) {
      return true;
    }

    return 'Passwords do not match.';
  }, [password]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useFieldType({
    path: 'confirm-password',
    disableFormData: true,
    required: true,
    validate,
    enableDebouncedValue: true,
  });

  const classes = [
    'field-type',
    'confirm-password',
    showError && 'error',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Error
        showError={showError}
        message={errorMessage}
      />
      <Label
        htmlFor="confirm-password"
        label="Confirm Password"
        required
      />
      <input
        value={value || ''}
        onChange={setValue}
        type="password"
        autoComplete="off"
        id="confirm-password"
        name="confirm-password"
      />
    </div>
  );
};

export default ConfirmPassword;
