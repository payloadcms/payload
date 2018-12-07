import React from 'react';
import { fieldType } from 'payload/components';

import './index.scss';

const errors = {
  text: 'Please fill in the field'
};

const validate = value => value.length > 0;

const Textarea = props => {
  return (
    <div className={props.className} style={props.style}>
      {props.error}
      {props.label}
      <textarea
        value={ props.value }
        onChange={props.onChange}
        disabled={props.disabled}
        placeholder={props.placeholder}
        type={props.type}
        id={props.id ? props.id : props.name}
        name={props.name}>
      </textarea>
    </div>
  );
}

export default fieldType(Textarea, 'textarea', validate, errors);
