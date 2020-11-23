import React from 'react';
import { Props } from './types';

import './index.scss';

const baseClass = 'popup-button';

const PopupButton: React.FC<Props> = (props) => {
  const {
    buttonType,
    button,
    setActive,
    active,
    onToggleOpen,
  } = props;

  const classes = [
    baseClass,
    `${baseClass}--${buttonType}`,
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (typeof onToggleOpen === 'function') onToggleOpen(!active);
    setActive(!active);
  };

  if (buttonType === 'custom') {
    return (
      <div
        role="button"
        tabIndex="0"
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
