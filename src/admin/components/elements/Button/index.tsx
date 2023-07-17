import React, { Fragment, isValidElement } from 'react';
import { Link } from 'react-router-dom';
import { Props } from './types';

import plus from '../../icons/Plus';
import x from '../../icons/X';
import chevron from '../../icons/Chevron';
import edit from '../../icons/Edit';
import swap from '../../icons/Swap';
import linkIcon from '../../icons/Link';
import Tooltip from '../Tooltip';

import './index.scss';

const icons = {
  plus,
  x,
  chevron,
  edit,
  swap,
  link: linkIcon,
};

const baseClass = 'btn';

const ButtonContents = ({ children, icon, tooltip, showTooltip }) => {
  const BuiltInIcon = icons[icon];

  return (
    <Fragment>
      {tooltip && (
        <Tooltip
          className={`${baseClass}__tooltip`}
          show={showTooltip}
        >
          {tooltip}
        </Tooltip>
      )}
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
    </Fragment>
  );
};

const Button: React.FC<Props> = (props) => {
  const {
    className,
    id,
    type = 'button',
    el = 'button',
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

  const [showTooltip, setShowTooltip] = React.useState(false);

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
    setShowTooltip(false);
    if (type !== 'submit' && onClick) event.preventDefault();
    if (onClick) onClick(event);
  }

  const buttonProps = {
    id,
    type,
    className: classes,
    disabled,
    onMouseEnter: tooltip ? () => setShowTooltip(true) : undefined,
    onMouseLeave: tooltip ? () => setShowTooltip(false) : undefined,
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
            showTooltip={showTooltip}
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
            showTooltip={showTooltip}
          >
            {children}
          </ButtonContents>
        </a>
      );

    default:
      const Tag = el; // eslint-disable-line no-case-declarations

      return (
        <Tag
          type="submit"
          {...buttonProps}
        >
          <ButtonContents
            icon={icon}
            tooltip={tooltip}
            showTooltip={showTooltip}
          >
            {children}
          </ButtonContents>
        </Tag>
      );
  }
};

export default Button;
