import React from 'react';
import { useTranslation } from 'react-i18next';
import { Props } from './types';
import { getTranslation } from '../../../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'radio-input';

const RadioInput: React.FC<Props> = (props) => {
  const { isSelected, option, onChange, path } = props;
  const { i18n } = useTranslation();
  const [isFocused, setIsFocused] = React.useState(false);

  const classes = [
    baseClass,
    isSelected && `${baseClass}--is-selected`,
    isFocused && `${baseClass}--is-focused`,
  ].filter(Boolean).join(' ');

  const id = `field-${path}-${option.value}`;

  return (
    <label
      htmlFor={id}
    >
      <div className={classes}>
        <input
          id={id}
          type="radio"
          checked={isSelected}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={() => (typeof onChange === 'function' ? onChange(option.value) : null)}
        />
        <span className={`${baseClass}__styled-radio`} />
        <span className={`${baseClass}__label`}>{getTranslation(option.label, i18n)}</span>
      </div>
    </label>
  );
};

export default RadioInput;
