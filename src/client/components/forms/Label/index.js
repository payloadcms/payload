import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const Label = (props) => {
  const {
    label, required, htmlFor,
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

Label.defaultProps = {
  required: false,
  label: '',
};

Label.propTypes = {
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
  ]),
  htmlFor: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

export default Label;
