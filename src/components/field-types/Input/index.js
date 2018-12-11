import React from 'react';
import { fieldType } from 'payload/components';

import './index.scss';

const error = 'Please fill in the field';

const validate = value => value.length > 0;

const Input = props => {
  return (
    <div className={props.className} style={{
      ...props.style,
      width: props.width ? `${props.width}%` : null
    }}>
      {props.error}
      {props.label}
      <input
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        placeholder={props.placeholder}
        type="text"
        id={props.id ? props.id : props.name}
        name={props.name} />
    </div>
  );
}

export default fieldType(Input, 'input', validate, error);
