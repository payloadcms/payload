import React from 'react';
import fieldType from '../fieldType';

import './index.scss';

const error = 'Please enter a valid email';

const validate = value => /\S+@\S+\.\S+/.test(value);

const Email = props => {
  return (
    <div className={props.className} style={{
      ...props.style,
      width: props.width ? `${props.width}%` : null
    }}>
      {props.error}
      {props.label}
      <input
        value={props.value || ''}
        onChange={props.onChange}
        disabled={props.disabled}
        placeholder={props.placeholder}
        type="email"
        id={props.id ? props.id : props.name}
        name={props.name} />
    </div>
  );
}

export default fieldType(Email, 'email', validate, error);
