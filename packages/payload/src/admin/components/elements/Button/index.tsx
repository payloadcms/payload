import React, { Fragment, forwardRef, isValidElement } from 'react'
import { Link } from 'react-router-dom'

import type { Props } from './types'

import chevron from '../../icons/Chevron'
import edit from '../../icons/Edit'
import linkIcon from '../../icons/Link'
import plus from '../../icons/Plus'
import swap from '../../icons/Swap'
import x from '../../icons/X'
import Tooltip from '../Tooltip'
import './index.scss'

const icons = {
  chevron,
  edit,
  link: linkIcon,
  plus,
  swap,
  x,
}

const baseClass = 'btn'

const ButtonContents = ({ children, icon, showTooltip, tooltip }) => {
  const BuiltInIcon = icons[icon]

  return (
    <Fragment>
      {tooltip && (
        <Tooltip className={`${baseClass}__tooltip`} show={showTooltip}>
          {tooltip}
        </Tooltip>
      )}
      <span className={`${baseClass}__content`}>
        {children && <span className={`${baseClass}__label`}>{children}</span>}
        {icon && (
          <span className={`${baseClass}__icon`}>
            {isValidElement(icon) && icon}
            {BuiltInIcon && <BuiltInIcon />}
          </span>
        )}
      </span>
    </Fragment>
  )
}

const Button = forwardRef<HTMLAnchorElement | HTMLButtonElement, Props>((props, ref) => {
  const {
    id,
    'aria-label': ariaLabel,
    buttonStyle = 'primary',
    children,
    className,
    disabled,
    el = 'button',
    icon,
    iconPosition = 'right',
    iconStyle = 'without-border',
    newTab,
    onClick,
    round,
    size = 'medium',
    to,
    tooltip,
    type = 'button',
    url,
  } = props

  const [showTooltip, setShowTooltip] = React.useState(false)

  const classes = [
    baseClass,
    className && className,
    buttonStyle && `${baseClass}--style-${buttonStyle}`,
    icon && `${baseClass}--icon`,
    iconStyle && `${baseClass}--icon-style-${iconStyle}`,
    icon && !children && `${baseClass}--icon-only`,
    disabled && `${baseClass}--disabled`,
    round && `${baseClass}--round`,
    size && `${baseClass}--size-${size}`,
    iconPosition && `${baseClass}--icon-position-${iconPosition}`,
    tooltip && `${baseClass}--has-tooltip`,
  ]
    .filter(Boolean)
    .join(' ')

  function handleClick(event) {
    setShowTooltip(false)
    if (type !== 'submit' && onClick) event.preventDefault()
    if (onClick) onClick(event)
  }

  const buttonProps = {
    id,
    'aria-disabled': disabled,
    'aria-label': ariaLabel,
    className: classes,
    disabled,
    onClick: !disabled ? handleClick : undefined,
    onMouseEnter: tooltip ? () => setShowTooltip(true) : undefined,
    onMouseLeave: tooltip ? () => setShowTooltip(false) : undefined,
    rel: newTab ? 'noopener noreferrer' : undefined,
    target: newTab ? '_blank' : undefined,
    type,
  }

  switch (el) {
    case 'link':
      return (
        <Link {...buttonProps} to={to || url}>
          <ButtonContents icon={icon} showTooltip={showTooltip} tooltip={tooltip}>
            {children}
          </ButtonContents>
        </Link>
      )

    case 'anchor':
      return (
        <a {...buttonProps} href={url} ref={ref as React.LegacyRef<HTMLAnchorElement>}>
          <ButtonContents icon={icon} showTooltip={showTooltip} tooltip={tooltip}>
            {children}
          </ButtonContents>
        </a>
      )

    default:
      const Tag = el // eslint-disable-line no-case-declarations

      return (
        <Tag ref={ref} type="submit" {...buttonProps}>
          <ButtonContents icon={icon} showTooltip={showTooltip} tooltip={tooltip}>
            {children}
          </ButtonContents>
        </Tag>
      )
  }
})

export default Button
