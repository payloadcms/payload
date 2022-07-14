import React, { isValidElement } from 'react';
import { Link } from 'react-router-dom';
import { Props } from './types';

import plus from '../../icons/Plus';
import x from '../../icons/X';
import chevron from '../../icons/Chevron';
import edit from '../../icons/Edit';
import swap from '../../icons/Swap';
import Tooltip from '../Tooltip';

import './index.scss';

const icons = {
  plus,
  x,
  chevron,
  edit,
  swap,
};

const baseClass = 'btn';

const ButtonContents = ({ children, icon, tooltip }) => {
  const BuiltInIcon = icons[icon];

  return (
    <span
      className={`${baseClass}__content`}
    >
      {tooltip && (
        <Tooltip className={`${baseClass}__tooltip`}>
          {tooltip}
        </Tooltip>
      )}
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
    id,
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
    tooltip,
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
    tooltip && `${baseClass}--has-tooltip`,
  ].filter(Boolean).join(' ');

  function handleClick(event) {
    if (type !== 'submit' && onClick) event.preventDefault();
    if (onClick) onClick(event);
  }

  const buttonProps = {
    id,
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
          <ButtonContents
            icon={icon}
            tooltip={tooltip}
          >
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
          <ButtonContents
            icon={icon}
            tooltip={tooltip}
          >
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
          <ButtonContents
            icon={icon}
            tooltip={tooltip}
          >
            {children}
          </ButtonContents>
        </button>
      );
  }
};

export default Button;
