import React from 'react';
import PropTypes from 'prop-types';
import LabelElement from '../../elements/Label';

import './index.scss';

const Label = (props) => {
  const {
    label, required, htmlFor,
  } = props;

  if (label) {
    return (
      <LabelElement
        as="label"
        htmlFor={htmlFor}
        className="field-label"
      >
        {label}
        {required
          && <span className="required">*</span>
        }
      </LabelElement>
    );
  }

  return null;
};

Label.defaultProps = {
  required: false,
  label: '',
};

Label.propTypes = {
  label: PropTypes.string,
  htmlFor: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

export default Label;
