import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'styled-checkbox';

const StyledCheckbox = ({
  onClick, isChecked, label, name, isDisabled,
}) => {
  const classes = [
    baseClass,
    isChecked && `${baseClass}--is-checked`,
    isDisabled && `${baseClass}--is-disabled`,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={() => (onClick && !isDisabled) && onClick(!isChecked)}
      type="button"
      title={label}
      role="checkbox"
      aria-checked={isChecked}
      aria-labelledby={name}
      tabIndex={0}
    >
      <span className="checked-symbol">x</span>
    </button>
  );
};

StyledCheckbox.defaultProps = {
  onClick: null,
  isChecked: false,
  label: 'Checkbox',
  isDisabled: false,
};

StyledCheckbox.propTypes = {
  onClick: PropTypes.func,
  isChecked: PropTypes.bool,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  isDisabled: PropTypes.bool,
};

export default StyledCheckbox;
