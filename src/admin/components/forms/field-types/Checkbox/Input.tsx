import React from 'react';
import Check from '../../../icons/Check';
import Label from '../../Label';

import './index.scss';

const baseClass = 'custom-checkbox';

type CheckboxInputProps = {
  onToggle: React.MouseEventHandler<HTMLButtonElement>
  inputRef?: React.MutableRefObject<HTMLInputElement>
  readOnly?: boolean
  checked?: boolean
  name?: string
  id?: string
  label?: string
  required?: boolean
}
export const CheckboxInput: React.FC<CheckboxInputProps> = (props) => {
  const {
    onToggle,
    checked,
    inputRef,
    name,
    id,
    label,
    readOnly,
    required,
  } = props;

  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <span
      className={[
        baseClass,
        checked && `${baseClass}--checked`,
        readOnly && `${baseClass}--read-only`,
        isFocused && `${baseClass}--is-focused`,
      ].filter(Boolean).join(' ')}
    >
      <input
        ref={inputRef}
        id={id}
        type="checkbox"
        name={name}
        checked={checked}
        readOnly
        tabIndex={-1}
      />
      <button
        type="button"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={onToggle}
      >
        <span className={`${baseClass}__input`}>
          <Check />
        </span>
        <Label
          htmlFor={id}
          label={label}
          required={required}
        />
      </button>
    </span>
  );
};
