import type { ChangeEvent } from 'react';

import React from 'react';
import { useTranslation } from 'react-i18next';

import type { TextareaField } from '../../../../../fields/config/types';
import type { Description } from '../../FieldDescription/types';

import { getTranslation } from '../../../../../utilities/getTranslation';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import Label from '../../Label';
import './index.scss';

export type TextAreaInputProps = Omit<TextareaField, 'type'> & {
  className?: string
  description?: Description
  errorMessage?: string
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  path: string
  placeholder?: Record<string, string> | string
  readOnly?: boolean
  required?: boolean
  rows?: number
  rtl?: boolean;
  showError?: boolean
  style?: React.CSSProperties
  value?: string
  width?: string
}

const TextareaInput: React.FC<TextAreaInputProps> = (props) => {
  const {
    className,
    description,
    errorMessage,
    label,
    onChange,
    path,
    placeholder,
    readOnly,
    required,
    rows,
    rtl,
    showError,
    style,
    value,
    width,
  } = props;

  const { i18n } = useTranslation();

  const classes = [
    'field-type',
    'textarea',
    className,
    showError && 'error',
    readOnly && 'read-only',
  ].filter(Boolean).join(' ');

  return (
    <div
      style={{
        ...style,
        width,
      }}
      className={classes}
    >
      <Error
        message={errorMessage}
        showError={showError}
      />
      <Label
        htmlFor={`field-${path.replace(/\./g, '__')}`}
        label={label}
        required={required}
      />
      <label
        className="textarea-outer"
        htmlFor={`field-${path.replace(/\./g, '__')}`}
      >
        <div className="textarea-inner">
          <div
            className="textarea-clone"
            data-value={value || placeholder || ''}
          />
          <textarea
            className="textarea-element"
            data-rtl={rtl}
            disabled={readOnly}
            id={`field-${path.replace(/\./g, '__')}`}
            name={path}
            onChange={onChange}
            placeholder={getTranslation(placeholder, i18n)}
            rows={rows}
            value={value || ''}
          />
        </div>
      </label>
      <FieldDescription
        description={description}
        value={value}
      />
    </div>
  );
};

export default TextareaInput;
