import React, { ChangeEvent } from 'react';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { TextField } from '../../../../../fields/config/types';
import { Description } from '../../FieldDescription/types';
// import { FieldType } from '../../useField/types';

import './index.scss';

export type TextInputProps = Omit<TextField, 'type'> & {
  showError?: boolean
  errorMessage?: string
  readOnly?: boolean
  path: string
  required?: boolean
  value?: string
  description?: Description
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  style?: React.CSSProperties
  className?: string
  width?: string
}

const TextInput: React.FC<TextInputProps> = (props) => {
  const {
    showError,
    errorMessage,
    placeholder,
    readOnly,
    path,
    label,
    required,
    value,
    onChange,
    description,
    style,
    className,
    width,
  } = props;

  const classes = [
    'field-type',
    'text',
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
        htmlFor={path}
        label={label}
        required={required}
      />
      <input
        value={value || ''}
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

export default TextInput;
