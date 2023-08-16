import React from 'react';
import Check from '../../../icons/Check';
import Label from '../../Label';
import Line from '../../../icons/Line';

import './index.scss';

const baseClass = 'custom-checkbox';

type CheckboxInputProps = {
  onToggle: React.FormEventHandler<HTMLInputElement>
  inputRef?: React.MutableRefObject<HTMLInputElement>
  readOnly?: boolean
  checked?: boolean
  partialChecked?: boolean
  name?: string
  id?: string
  label?: string
  'aria-label'?: string
  required?: boolean
}

export const CheckboxInput: React.FC<CheckboxInputProps> = (props) => {
  const {
    onToggle,
    checked,
    partialChecked,
    inputRef,
    name,
    id,
    label,
    'aria-label': ariaLabel,
    readOnly,
    required,
  } = props;

  return (
    <div
      className={[
        baseClass,
        (checked || partialChecked) && `${baseClass}--checked`,
        readOnly && `${baseClass}--read-only`,
      ].filter(Boolean).join(' ')}
    >
      <div className={`${baseClass}__input`}>
        <input
          ref={inputRef}
          id={id}
          type="checkbox"
          name={name}
          aria-label={ariaLabel}
          checked={Boolean(checked)}
          readOnly
          onInput={onToggle}
        />
        <span className={`${baseClass}__icon ${!partialChecked ? 'check' : 'partial'}`}>
          {!partialChecked && (
            <Check />
          )}
          {partialChecked && (
            <Line />
          )}
        </span>
      </div>
      {label && (
        <Label
          htmlFor={id}
          label={label}
          required={required}
        />
      )}
    </div>
  );
};
