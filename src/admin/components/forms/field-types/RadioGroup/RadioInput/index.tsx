import React from 'react';
import { Props } from './types';

import './index.scss';

const baseClass = 'radio-input';

const RadioInput: React.FC<Props> = (props) => {
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

export default RadioInput;
