import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useField from '../../useField';
import withCondition from '../../withCondition';
import Error from '../../Error';
import { checkbox } from '../../../../../fields/validations';
import Check from '../../../icons/Check';
import FieldDescription from '../../FieldDescription';
import { Props } from './types';
import { getTranslation } from '../../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'checkbox';

const Checkbox: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    validate = checkbox,
    label,
    onChange,
    disableFormData,
    required,
    admin: {
      readOnly,
      style,
      className,
      width,
      description,
      condition,
    } = {},
  } = props;

  const { i18n } = useTranslation();

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required });
  }, [validate, required]);

  const {
    value,
    showError,
    errorMessage,
    setValue,
  } = useField({
    path,
    validate: memoizedValidate,
    disableFormData,
    condition,
  });

  return (
    <div
      className={[
        'field-type',
        baseClass,
        showError && 'error',
        className,
        value && `${baseClass}--checked`,
        readOnly && `${baseClass}--read-only`,
      ].filter(Boolean).join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__error-wrap`}>
        <Error
          showError={showError}
          message={errorMessage}
        />
      </div>
      <input
        id={`field-${path.replace(/\./gi, '__')}`}
        type="checkbox"
        name={path}
        checked={Boolean(value)}
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
          {getTranslation(label || name, i18n)}
        </span>
      </button>
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(Checkbox);
