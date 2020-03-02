import React from 'react';
import PropTypes from 'prop-types';

import Arrow from '../../../graphics/Arrow';

import './index.scss';

const baseClass = 'clickable-arrow';

const ClickableArrow = (props) => {
  const {
    updatePage,
    isDisabled,
    direction,
  } = props;

  const classes = [
    baseClass,
    isDisabled && `${baseClass}--is-disabled`,
    direction && `${baseClass}--${direction}`,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={!isDisabled && updatePage}
      type="button"
    >
      <Arrow />
    </button>
  );
};

ClickableArrow.defaultProps = {
  updatePage: null,
  isDisabled: false,
  direction: 'right',
};

ClickableArrow.propTypes = {
  updatePage: PropTypes.func,
  isDisabled: PropTypes.bool,
  direction: PropTypes.oneOf(['right', 'left']),
};

export default ClickableArrow;
