import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'label';

const Label = ({ children, as: Element, htmlFor }) => {
  return (
    <Element
      className={baseClass}
      htmlFor={htmlFor}
    >
      {children}
    </Element>
  );
};

Label.defaultProps = {
  as: 'span',
  htmlFor: undefined,
};

Label.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.string,
  ]).isRequired,
  as: PropTypes.oneOf(['label', 'span']),
  htmlFor: PropTypes.string,
};

export default Label;
