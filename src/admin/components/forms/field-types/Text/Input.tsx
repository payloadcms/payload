import React, { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { TextField } from '../../../../../fields/config/types';
import { Description } from '../../FieldDescription/types';
import { getTranslation } from '../../../../../utilities/getTranslation';

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
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  placeholder?: Record<string, string> | string
  style?: React.CSSProperties
  className?: string
  width?: string
  inputRef?: React.MutableRefObject<HTMLInputElement>
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
    onKeyDown,
    description,
    style,
    className,
    width,
    inputRef,
  } = props;

  const { i18n } = useTranslation();

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
        htmlFor={`field-${path.replace(/\./gi, '__')}`}
        label={label}
        required={required}
      />
      <input
        ref={inputRef}
        id={`field-${path.replace(/\./gi, '__')}`}
        value={value || ''}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={readOnly}
        placeholder={getTranslation(placeholder, i18n)}
        type="text"
        name={path}
      />
      <FieldDescription
        className={`field-description-${path.replace(/\./gi, '__')}`}
        value={value}
        description={description}
      />
    </div>
  );
};

export default TextInput;
