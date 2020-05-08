import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'label';

const Label = ({
  children, as: Element, htmlFor, className,
}) => {
  const classes = [
    baseClass,
    className && className,
  ].filter(Boolean).join(' ');

  return (
    <Element
      className={classes}
      htmlFor={htmlFor}
    >
      {children}
    </Element>
  );
};

Label.defaultProps = {
  as: 'span',
  htmlFor: undefined,
  className: undefined,
};

Label.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.string,
  ]).isRequired,
  as: PropTypes.oneOf(['label', 'span']),
  htmlFor: PropTypes.string,
  className: PropTypes.string,
};

export default Label;
