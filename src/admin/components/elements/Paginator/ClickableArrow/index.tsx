import React from 'react';
import { Props } from './types';

import Chevron from '../../../icons/Chevron';

import './index.scss';

const baseClass = 'clickable-arrow';

const ClickableArrow: React.FC<Props> = (props) => {
  const {
    updatePage,
    isDisabled = false,
    direction = 'right',
  } = props;

  const classes = [
    baseClass,
    isDisabled && `${baseClass}--is-disabled`,
    direction && `${baseClass}--${direction}`,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={!isDisabled ? updatePage : undefined}
      type="button"
    >
      <Chevron />
    </button>
  );
};

export default ClickableArrow;
