import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'styled-checkbox';

const StyledCheckbox = ({
  onClick, isChecked, label, name, isDisabled, hasError,
}) => {
  const classes = [
    baseClass,
    isChecked && `${baseClass}--is-checked`,
    isDisabled && `${baseClass}--is-disabled`,
    hasError && `${baseClass}--has-error`,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={() => !isDisabled && onClick(!isChecked)}
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
  isChecked: false,
  label: 'Checkbox',
  isDisabled: false,
  hasError: false,
};

StyledCheckbox.propTypes = {
  onClick: PropTypes.func.isRequired,
  isChecked: PropTypes.bool,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  isDisabled: PropTypes.bool,
  hasError: PropTypes.bool,
};

export default StyledCheckbox;
