import React from 'react';
import PropTypes from 'prop-types';

import Button from '../../../../../elements/Button';

import './index.scss';

const baseClass = 'command-button';

const CommandButton = (props) => {
  const { isActive, children } = props;

  const classes = [
    baseClass,
    isActive && `${baseClass}--is-active`,
  ].filter(Boolean).join(' ');

  return (
    <Button
      className={classes}
      size="small"
      {...props}
    >
      {children}
    </Button>
  );
};

CommandButton.defaultProps = {
  isActive: false,
  children: null,
};

CommandButton.propTypes = {
  isActive: PropTypes.bool,
  children: PropTypes.node,
};

export default CommandButton;
