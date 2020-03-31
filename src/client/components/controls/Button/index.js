import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import './index.scss';

const baseClass = 'btn';

const Button = (props) => {
  const {
    className, type, size, icon, el, to, url, children, onClick, disabled,
  } = props;

  const classes = [
    baseClass,
    className && className,
    type && `btn-${type}`,
    size && `btn-${size}`,
    icon && 'btn-icon',
    disabled && 'btn-disabled',
  ].filter(Boolean).join(' ');

  function handleClick(event) {
    if (type !== 'submit' && onClick) event.preventDefault();
    if (onClick) onClick();
  }

  const buttonProps = {
    ...props,
    className: classes,
    onClick: handleClick,
  };

  switch (el) {
    case 'link':
      return (
        <Link
          {...buttonProps}
          to={to || url}
        >
          {children}
        </Link>
      );

    case 'anchor':
      return (
        <a
          {...buttonProps}
          href={url}
        >
          {children}
        </a>
      );

    default:
      return (
        <button
          type="button"
          {...buttonProps}
        >
          {children}
        </button>
      );
  }
};

Button.defaultProps = {
  className: null,
  type: null,
  size: null,
  icon: null,
  el: null,
  to: null,
  url: null,
  children: null,
  onClick: null,
  disabled: undefined,
};

Button.propTypes = {
  className: PropTypes.string,
  type: PropTypes.oneOf(['secondary', 'error', undefined]),
  size: PropTypes.oneOf(['small', undefined]),
  icon: PropTypes.node,
  el: PropTypes.oneOf(['link', 'anchor', undefined]),
  to: PropTypes.string,
  url: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

export default Button;
