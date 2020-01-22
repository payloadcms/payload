import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../../modules/Tooltip';

const Error = (props) => {
  const { showError, message } = props;

  if (showError) {
    return (
      <Tooltip className="error-message">
        {message}
      </Tooltip>
    );
  }

  return null;
};

Error.defaultProps = {
  showError: false,
  message: 'Please complete this field.',
};

Error.propTypes = {
  showError: PropTypes.bool,
  message: PropTypes.string,
};

export default Error;
