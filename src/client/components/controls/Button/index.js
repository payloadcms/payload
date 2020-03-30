import React from 'react';
import { Link } from 'react-router-dom';

import './index.scss';

const baseClass = 'btn';

const Button = (props) => {
  const {
    className, type, size, icon, el, to, url, children, onClick,
  } = props;

  const classes = [
    baseClass,
    className && className,
    type && `btn-${type}`,
    size && `btn-${size}`,
    icon && 'btn-icon',
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

export default Button;
