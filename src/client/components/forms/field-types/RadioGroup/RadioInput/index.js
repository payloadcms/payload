import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'radio-input';

const RadioInput = (props) => {
  const { isSelected, option, onChange } = props;

  const classes = [
    baseClass,
    isSelected && `${baseClass}--is-selected`,
  ].filter(Boolean).join(' ');

  return (
    <label

      htmlFor={option.label}
    >
      <div className={classes}>
        <input
          id={option.label}
          type="radio"
          checked={isSelected}
          onChange={() => onChange(option.value)}
        />
        <span className={`${baseClass}__styled-radio`} />
        <span className={`${baseClass}__label`}>{option.label}</span>
      </div>
    </label>
  );
};

RadioInput.defaultProps = {
  isSelected: false,
};

RadioInput.propTypes = {
  isSelected: PropTypes.bool,
  option: PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default RadioInput;
