import React, { ChangeEvent } from 'react';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { TextareaField } from '../../../../../fields/config/types';
import { Description } from '../../FieldDescription/types';

import './index.scss';

export type TextAreaInputProps = Omit<TextareaField, 'type'> & {
  showError?: boolean
  errorMessage?: string
  readOnly?: boolean
  path: string
  required?: boolean
  value?: string
  description?: Description
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  style?: React.CSSProperties
  className?: string
  width?: string
  rows?: number
}

const TextareaInput: React.FC<TextAreaInputProps> = (props) => {
  const {
    path,
    required,
    readOnly,
    style,
    className,
    width,
    placeholder,
    description,
    label,
    showError,
    value,
    errorMessage,
    onChange,
    rows,
  } = props;

  const classes = [
    'field-type',
    'textarea',
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
      <textarea
        value={value || ''}
        onChange={onChange}
        disabled={readOnly}
        placeholder={placeholder}
        id={path}
        name={path}
        rows={rows}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default TextareaInput;
