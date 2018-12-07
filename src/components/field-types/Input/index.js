import React from 'react';
import { fieldType } from 'payload/components';

import './index.scss';

const errors = {
  text: 'Please fill in the field',
  email: 'Please enter a valid email',
  password: 'Please enter a password'
};

const validate = (value, type) => {
  let emailTest = /\S+@\S+\.\S+/;

  switch (type) {
  case 'text':
    return value.length > 0;

  case 'password':
    return value.length > 0;

  case 'email':
    return emailTest.test(value);

  case 'hidden':
    return true;

  default:
    return false;
  }
}

const Input = props => {
  return (
    <div className={props.className} style={props.style}>
      {props.error}
      {props.label}
      <input
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        placeholder={props.placeholder}
        type={props.type}
        id={props.id ? props.id : props.name}
        name={props.name} />
    </div>
  );
}

export default fieldType(Input, 'input', validate, errors);
