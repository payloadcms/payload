import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'radio-input';

const RadioInput = (props) => {
  const { isSelected, option, onChange, path } = props;

  const classes = [
    baseClass,
    isSelected && `${baseClass}--is-selected`,
  ].filter(Boolean).join(' ');

  const id = `${path}-${option.value}`;

  return (
    <label
      htmlFor={id}
    >
      <div className={classes}>
        <input
          id={id}
          type="radio"
          checked={isSelected}
          onChange={() => (typeof onChange === 'function' ? onChange(option.value) : null)}
        />
        <span className={`${baseClass}__styled-radio`} />
        <span className={`${baseClass}__label`}>{option.label}</span>
      </div>
    </label>
  );
};

RadioInput.defaultProps = {
  isSelected: false,
  onChange: undefined,
};

RadioInput.propTypes = {
  isSelected: PropTypes.bool,
  option: PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  }).isRequired,
  onChange: PropTypes.func,
  path: PropTypes.string.isRequired,
};

export default RadioInput;
