import React, { isValidElement } from 'react';
import { Link } from 'react-router-dom';
import { Props } from './types';

import plus from '../../icons/Plus';
import x from '../../icons/X';
import chevron from '../../icons/Chevron';
import edit from '../../icons/Edit';

import './index.scss';

const icons = {
  plus,
  x,
  chevron,
  edit,
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

const Button: React.FC<Props> = (props) => {
  const {
    className,
    type = 'button',
    el,
    to,
    url,
    children,
    onClick,
    disabled,
    icon,
    iconStyle = 'without-border',
    buttonStyle = 'primary',
    round,
    size = 'medium',
    iconPosition = 'right',
    newTab,
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
    if (onClick) onClick(event);
  }

  const buttonProps = {
    type,
    className: classes,
    disabled,
    onClick: !disabled ? handleClick : undefined,
    rel: newTab ? 'noopener noreferrer' : undefined,
    target: newTab ? '_blank' : undefined,
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

export default Button;
