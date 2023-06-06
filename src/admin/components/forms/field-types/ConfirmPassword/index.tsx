import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useField from '../../useField';
import Label from '../../Label';
import Error from '../../Error';
import { useFormFields } from '../../Form/context';
import { Field } from '../../Form/types';
import type { Props } from './types';

import './index.scss';

const ConfirmPassword: React.FC<Props> = (props) => {
  const {
    disabled,
  } = props;

  const password = useFormFields<Field>(([fields]) => fields.password);
  const { t } = useTranslation('fields');

  const validate = useCallback((value: string) => {
    if (!value) {
      return t('validation:required');
    }

    if (value === password?.value) {
      return true;
    }

    return t('passwordsDoNotMatch');
  }, [password, t]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useField({
    path: 'confirm-password',
    disableFormData: true,
    validate,
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
        htmlFor="field-confirm-password"
        label={t('authentication:confirmPassword')}
        required
      />
      <input
        value={value as string || ''}
        onChange={setValue}
        type="password"
        autoComplete="off"
        id="field-confirm-password"
        name="confirm-password"
        disabled={!!disabled}
      />
    </div>
  );
};

export default ConfirmPassword;
