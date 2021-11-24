import React, { useCallback, useEffect } from 'react';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import { text } from '../../../../../fields/validations';
import { Props } from './types';
import FieldDescription from '../../FieldDescription';

import './index.scss';

const Text: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = text,
    label,
    admin: {
      placeholder,
      readOnly,
      style,
      width,
      description,
      condition,
    } = {},
    value: valueFromProps,
    onChange: onChangeFromProps,
  } = props;

  const path = pathFromProps || name;

  const fieldType = useFieldType<string>({
    path,
    validate,
    enableDebouncedValue: true,
    condition,
  });

  const {
    value: valueFromContext,
    showError,
    setValue,
    errorMessage,
  } = fieldType;

  const onChange = useCallback((e) => {
    const { value: incomingValue } = e.target;
    if (typeof onChangeFromProps === 'function') {
      onChangeFromProps(incomingValue);
    } else {
      setValue(e);
    }
  }, [
    onChangeFromProps,
    setValue,
  ]);

  const classes = [
    'field-type',
    'text',
    showError && 'error',
    readOnly && 'read-only',
  ].filter(Boolean).join(' ');

  const value = valueFromProps || valueFromContext || '';

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
        value={value}
        onChange={onChange}
        disabled={readOnly}
        placeholder={placeholder}
        type="text"
        id={path}
        name={path}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(Text);
