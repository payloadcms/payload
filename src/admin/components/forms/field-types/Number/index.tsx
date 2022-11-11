import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useField from '../../useField';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import withCondition from '../../withCondition';
import { number } from '../../../../../fields/validations';
import { Props } from './types';
import { getTranslation } from '../../../../../utilities/getTranslation';

import './index.scss';

const NumberField: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate = number,
    label,
    max,
    min,
    admin: {
      readOnly,
      style,
      className,
      width,
      step,
      placeholder,
      description,
      condition,
    } = {},
  } = props;

  const { i18n } = useTranslation();

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, min, max, required });
  }, [validate, min, max, required]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useField({
    path,
    validate: memoizedValidate,
    condition,
  });

  const handleChange = useCallback((e) => {
    const val = parseFloat(e.target.value);

    if (Number.isNaN(val)) {
      setValue('');
    } else {
      setValue(val);
    }
  }, [setValue]);

  const classes = [
    'field-type',
    'number',
    className,
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
      <Label
        htmlFor={`field-${path.replace(/\./gi, '__')}`}
        label={label}
        required={required}
      />
      <input
        id={`field-${path.replace(/\./gi, '__')}`}
        value={typeof value === 'number' ? value : ''}
        onChange={handleChange}
        disabled={readOnly}
        placeholder={getTranslation(placeholder, i18n)}
        type="number"
        name={path}
        step={step}
        onWheel={(e) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          e.target.blur();
        }}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(NumberField);
