import React from 'react';
import PropTypes from 'prop-types';
import SmallLabel from '../../elements/SmallLabel';

import './index.scss';

const Label = (props) => {
  const {
    label, required, htmlFor,
  } = props;

  if (label) {
    return (
      <SmallLabel
        as="label"
        htmlFor={htmlFor}
        className="field-label"
      >
        {label}
        {required
          && <span className="required">*</span>
        }
      </SmallLabel>
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
