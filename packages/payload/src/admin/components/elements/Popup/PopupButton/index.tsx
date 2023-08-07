import React from 'react';
import { Props } from './types';

import './index.scss';

const baseClass = 'popup-button';

const PopupButton: React.FC<Props> = (props) => {
  const {
    className,
    buttonType,
    button,
    setActive,
    active,
  } = props;

  const classes = [
    baseClass,
    className,
    `${baseClass}--${buttonType}`,
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    setActive(!active);
  };

  if (buttonType === 'none') {
    return null;
  }

  if (buttonType === 'custom') {
    return (
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
        onClick={handleClick}
        className={classes}
      >
        {button}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(!active)}
      className={classes}
    >
      {button}
    </button>
  );
};

export default PopupButton;
