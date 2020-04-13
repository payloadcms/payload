import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'pill';

const Pill = ({ children, className }) => {
  const classes = [
    baseClass,
    className && className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

Pill.defaultProps = {
  children: undefined,
  className: '',
};

Pill.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export default Pill;
