import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import './index.scss';

const baseClass = 'pill';

const Pill = ({ children, className, to }) => {
  const classes = [
    baseClass,
    className && className,
    to && `${baseClass}--has-link`,
  ].filter(Boolean).join(' ');

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
      >
        {children}
      </Link>
    );
  }

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
