import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'popup-button';

const PopupButton = (props) => {
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

PopupButton.defaultProps = {
  buttonType: null,
  onToggleOpen: undefined,
};

PopupButton.propTypes = {
  buttonType: PropTypes.oneOf(['custom', 'default']),
  button: PropTypes.node.isRequired,
  setActive: PropTypes.func.isRequired,
  active: PropTypes.bool.isRequired,
  onToggleOpen: PropTypes.func,
};

export default PopupButton;
