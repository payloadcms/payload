import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const StyledCheckbox = ({ onClick, isChecked }) => {
  return (
    <button
      className="styled-checkbox"
      onClick={() => onClick(!isChecked)}
      type="button"
    >
      {isChecked ? 'X' : '-'}
    </button>
  );
};

StyledCheckbox.defaultProps = {
  onClick: null,
  isChecked: false,
};

StyledCheckbox.propTypes = {
  onClick: PropTypes.func,
  isChecked: PropTypes.bool,
};

export default StyledCheckbox;
