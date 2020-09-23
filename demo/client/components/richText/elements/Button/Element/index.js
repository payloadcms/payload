import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'rich-text-button';

const ButtonElement = ({ attributes, children, element }) => {
  const { label, style = 'primary' } = element;

  return (
    <span
      {...attributes}
      className={[
        baseClass,
        `${baseClass}--${style}`,
      ].join(' ')}
    >
      {label}
      {children}
    </span>
  );
};

ButtonElement.defaultProps = {
  attributes: {},
  children: null,
};

ButtonElement.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
  element: PropTypes.shape({
    style: PropTypes.oneOf(['primary', 'secondary']),
    label: PropTypes.string,
  }).isRequired,
};

export default ButtonElement;
