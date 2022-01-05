import React, { useCallback } from 'react';
import useField from '../../useField';
import withCondition from '../../withCondition';
import Error from '../../Error';
import { checkbox } from '../../../../../fields/validations';
import Check from '../../../icons/Check';
import FieldDescription from '../../FieldDescription';
import { Props } from './types';

import './index.scss';

const baseClass = 'checkbox';

const Checkbox: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate = checkbox,
    label,
    onChange,
    disableFormData,
    admin: {
      readOnly,
      style,
      className,
      width,
      description,
      condition,
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
        type="checkbox"
        name={path}
        id={path}
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
          {label}
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
