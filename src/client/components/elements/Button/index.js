import React, { isValidElement } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import plus from '../../icons/Plus';
import x from '../../icons/X';
import chevron from '../../icons/Chevron';

import './index.scss';

const icons = {
  plus,
  x,
  chevron,
};

const baseClass = 'btn';

const ButtonContents = ({ children, icon }) => {
  const BuiltInIcon = icons[icon];

  return (
    <span className={`${baseClass}__content`}>
      {children && (
        <span className={`${baseClass}__label`}>
          {children}
        </span>
      )}
      {icon && (
        <span className={`${baseClass}__icon`}>
          {isValidElement(icon) && icon}
          {BuiltInIcon && <BuiltInIcon />}
        </span>
      )}
    </span>
  );
};

ButtonContents.defaultProps = {
  icon: null,
  children: null,
};

ButtonContents.propTypes = {
  children: PropTypes.node,
  icon: PropTypes.node,
};

const Button = (props) => {
  const {
    className,
    type,
    el,
    to,
    url,
    children,
    onClick,
    disabled,
    icon,
    iconStyle,
    buttonStyle,
    round,
    size,
    iconPosition,
  } = props;

  const classes = [
    baseClass,
    className && className,
    buttonStyle && `${baseClass}--style-${buttonStyle}`,
    icon && `${baseClass}--icon`,
    iconStyle && `${baseClass}--icon-style-${iconStyle}`,
    (icon && !children) && `${baseClass}--icon-only`,
    disabled && `${baseClass}--disabled`,
    round && `${baseClass}--round`,
    size && `${baseClass}--size-${size}`,
    iconPosition && `${baseClass}--icon-position-${iconPosition}`,
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
  type: 'button',
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
  iconPosition: 'right',
  iconStyle: 'without-border',
};

Button.propTypes = {
  round: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.oneOf(['submit', 'button']),
  size: PropTypes.oneOf(['small', 'medium']),
  buttonStyle: PropTypes.oneOf(['primary', 'secondary', 'transparent', 'error', 'none', 'icon-label']),
  el: PropTypes.oneOf(['link', 'anchor', undefined]),
  to: PropTypes.string,
  url: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  iconStyle: PropTypes.oneOfType([
    'with-border',
    'without-border',
    'none',
  ]),
  icon: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.oneOf(['chevron', 'x', 'plus']),
  ]),
  iconPosition: PropTypes.oneOf(['left', 'right']),
};

export default Button;
