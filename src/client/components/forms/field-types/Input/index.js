import React from 'react';
import fieldType from '../fieldType';

import './index.scss';

const error = 'Please fill in the field';

const validate = value => value.length > 0;

const Input = (props) => {
  const {
    className,
    style,
    width,
    error,
    label,
    value,
    onChange,
    disabled,
    placeholder,
    id,
    name,
  } = props;

  return (
    <div className={className} style={{
      ...style,
      width: width ? `${width}%` : null
    }}>
      {error}
      {label}
      <input
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        type="text"
        id={id ? id : name}
        name={name} />
    </div>
  );
}

export default fieldType(Input, 'input', validate, error);
