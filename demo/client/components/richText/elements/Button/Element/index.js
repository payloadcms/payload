import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'rich-text-button';

const ButtonElement = ({ attributes, children, element }) => {
  const { style = 'primary', label } = element;

  return (
    <div
      className={baseClass}
      contentEditable={false}
    >
      <span
        {...attributes}
        className={[
          `${baseClass}__button`,
          `${baseClass}__button--${style}`,
        ].join(' ')}
      >
        {label}
        {children}
      </span>
    </div>
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
