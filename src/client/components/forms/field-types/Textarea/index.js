import React from 'react';
import PropTypes from 'prop-types';
import fieldType from '../../fieldType';

import './index.scss';

const errorMessage = 'Please fill in the textarea';

const validate = value => value.length > 0;

const Textarea = (props) => {
  const {
    className,
    style,
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
    <div
      className={className}
      style={style}
    >
      {error}
      {label}
      <textarea
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        id={id || name}
        name={name}
      />
    </div>
  );
};

Textarea.defaultProps = {
  className: null,
  style: {},
  error: null,
  label: null,
  value: '',
  onChange: null,
  disabled: null,
  placeholder: null,
  id: null,
  name: 'textarea',
};

Textarea.propTypes = {
  className: PropTypes.string,
  style: PropTypes.shape({}),
  error: PropTypes.node,
  label: PropTypes.node,
  value: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.string,
  placeholder: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
};

export default fieldType(Textarea, 'textarea', validate, errorMessage);
