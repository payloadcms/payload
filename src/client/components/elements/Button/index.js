import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import './index.scss';

const baseClass = 'btn';

const ButtonContents = ({ children, icon }) => {
  return (
    <span>
      {children}
      {icon}
    </span>
  );
};

ButtonContents.defaultProps = {
  icon: null,
};

ButtonContents.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node,
};

const Button = (props) => {
  const {
    className, type, el, to, url, children, onClick, disabled, icon, buttonStyle, round, size,
  } = props;

  const classes = [
    baseClass,
    className && className,
    buttonStyle && `${baseClass}--style-${buttonStyle}`,
    icon && `${baseClass}--icon`,
    (icon && !children) && `${baseClass}--icon-only`,
    disabled && `${baseClass}--disabled`,
    round && `${baseClass}--round`,
    size && `${baseClass}--size-${size}`,
  ].filter(Boolean).join(' ');

  function handleClick(event) {
    if (type !== 'submit' && onClick) event.preventDefault();
    if (onClick) onClick();
  }

  const buttonProps = {
    type,
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
          <ButtonContents icon={icon}>
            {children}
          </ButtonContents>
        </Link>
      );

    case 'anchor':
      return (
        <a
          {...buttonProps}
          href={url}
        >
          <ButtonContents icon={icon}>
            {children}
          </ButtonContents>
        </a>
      );

    default:
      return (
        <button
          type="submit"
          {...buttonProps}
        >
          <ButtonContents icon={icon}>
            {children}
          </ButtonContents>
        </button>
      );
  }
};

Button.defaultProps = {
  className: null,
  type: 'submit',
  buttonStyle: 'primary',
  el: null,
  to: null,
  url: null,
  children: null,
  onClick: null,
  disabled: undefined,
  icon: null,
  size: 'medium',
  round: false,
};

Button.propTypes = {
  round: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.oneOf(['submit', 'button']),
  size: PropTypes.oneOf(['small', 'medium']),
  buttonStyle: PropTypes.oneOf(['primary', 'secondary', 'transparent', 'error', 'none']),
  el: PropTypes.oneOf(['link', 'anchor', undefined]),
  to: PropTypes.string,
  url: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
};

export default Button;
