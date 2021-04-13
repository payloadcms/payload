import React, { useCallback } from 'react';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Error from '../../Error';
import { checkbox } from '../../../../../fields/validations';
import Check from '../../../icons/Check';
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
      width,
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
  } = useFieldType({
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
        value && `${baseClass}--checked`,
        readOnly && `${baseClass}--read-only`,
      ].filter(Boolean).join(' ')}
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
    </div>
  );
};

export default withCondition(Checkbox);
