import React, { Fragment, forwardRef, isValidElement } from 'react'
import { Link } from 'react-router-dom'

import type { Props } from './types'

import chevron from '../../icons/Chevron'
import Chevron from '../../icons/Chevron'
import edit from '../../icons/Edit'
import linkIcon from '../../icons/Link'
import plus from '../../icons/Plus'
import swap from '../../icons/Swap'
import x from '../../icons/X'
import Popup from '../Popup'
import { ButtonGroup, Button as PopupButton } from '../Popup/PopupButtonList'
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

const SecondaryActions = ({ className, secondaryActions }) => {
  const [showSecondaryActions, setShowSecondaryActions] = React.useState<boolean>(false)
  const multipleActions = secondaryActions.length > 1

  return (
    <Popup
      button={
        <div>
          <Chevron />
        </div>
      }
      buttonClassName={[
        className && className,
        `${baseClass}__chevron`,
        showSecondaryActions && `${baseClass}__chevron--open`,
      ]
        .filter(Boolean)
        .join(' ')}
      onToggleOpen={(active) => setShowSecondaryActions(active)}
    >
      <ButtonGroup>
        {multipleActions ? (
          secondaryActions.map((action, i) => (
            <PopupButton key={i} onClick={action.onClick}>
              {action.label}
            </PopupButton>
          ))
        ) : (
          <PopupButton onClick={secondaryActions.onClick}>{secondaryActions.label}</PopupButton>
        )}
      </ButtonGroup>
    </Popup>
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
    secondaryActions,
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
    secondaryActions && `${baseClass}--has-secondary-actions`,
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

  const ButtonContent = (
    <ButtonContents icon={icon} showTooltip={showTooltip} tooltip={tooltip}>
      {children}
    </ButtonContents>
  )

  let buttonElement

  switch (el) {
    case 'link':
      buttonElement = (
        <Link {...buttonProps} to={to || url}>
          {ButtonContent}
        </Link>
      )
      break

    case 'anchor':
      buttonElement = (
        <a {...buttonProps} href={url} ref={ref as React.LegacyRef<HTMLAnchorElement>}>
          {ButtonContent}
        </a>
      )
      break

    default:
      const Tag = el // eslint-disable-line no-case-declarations
      buttonElement = (
        <Tag ref={ref} type="submit" {...buttonProps}>
          {ButtonContent}
        </Tag>
      )
      break
  }

  if (secondaryActions)
    return (
      <div className={`${baseClass}__wrap`}>
        {buttonElement}
        <SecondaryActions {...buttonProps} secondaryActions={secondaryActions} />
      </div>
    )

  return buttonElement
})

export default Button
