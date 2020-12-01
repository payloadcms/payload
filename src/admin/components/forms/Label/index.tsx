import React from 'react';
import { Props } from './types';
import './index.scss';

const Label: React.FC<Props> = (props) => {
  const {
    label, required = false, htmlFor,
  } = props;

  if (label) {
    return (
      <label
        htmlFor={htmlFor}
        className="field-label"
      >
        {label}
        {required && <span className="required">*</span>}
      </label>
    );
  }

  return null;
};

export default Label;
