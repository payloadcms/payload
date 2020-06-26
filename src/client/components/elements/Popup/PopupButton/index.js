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
  } = props;

  const classes = [
    baseClass,
    `${baseClass}--${buttonType}`,
  ].filter(Boolean).join(' ');

  if (buttonType === 'custom') {
    return (
      <div
        role="button"
        tabIndex="0"
        onClick={() => setActive(!active)}
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
};

PopupButton.propTypes = {
  buttonType: PropTypes.oneOf(['custom', 'default']),
  button: PropTypes.node.isRequired,
  setActive: PropTypes.func.isRequired,
  active: PropTypes.bool.isRequired,
};

export default PopupButton;
