'use client'
import React, { Fragment, forwardRef, isValidElement } from 'react'

import type { Props } from './types.js'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { EditIcon } from '../../icons/Edit/index.js'
import { LinkIcon } from '../../icons/Link/index.js'
import { PlusIcon } from '../../icons/Plus/index.js'
import { SwapIcon } from '../../icons/Swap/index.js'
import { XIcon } from '../../icons/X/index.js'
import { ButtonGroup, Button as PopupButton } from '../Popup/PopupButtonList/index.js'
import { Popup } from '../Popup/index.js'
import { Tooltip } from '../Tooltip/index.js'
import './index.scss'

const icons = {
  chevron: ChevronIcon,
  edit: EditIcon,
  link: LinkIcon,
  plus: PlusIcon,
  swap: SwapIcon,
  x: XIcon,
}

const baseClass = 'btn'

export const ButtonContents = ({ children, icon, showTooltip, tooltip }) => {
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

const SecondaryActions = ({ className, disabled, secondaryActions }) => {
  const [showSecondaryActions, setShowSecondaryActions] = React.useState<boolean>(false)
  const multipleActions = secondaryActions.length >= 1

  React.useEffect(() => {
    if (disabled) setShowSecondaryActions(false)
  }, [disabled])

  return (
    <Popup
      button={<ChevronIcon />}
      buttonClassName={[
        className && className,
        `${baseClass}__chevron`,
        showSecondaryActions && `${baseClass}__chevron--open`,
      ]
        .filter(Boolean)
        .join(' ')}
      className={disabled ? `${baseClass}--popup-disabled` : ''}
      disabled={disabled}
      horizontalAlign="right"
      noBackground
      onToggleOpen={(active) => (!disabled ? setShowSecondaryActions(active) : undefined)}
      size="large"
      verticalAlign="bottom"
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

export const Button = forwardRef<HTMLAnchorElement | HTMLButtonElement, Props>((props, ref) => {
  const {
    id,
    type = 'button',
    Link,
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
    icon && iconPosition && `${baseClass}--icon-position-${iconPosition}`,
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
    type,
    'aria-disabled': disabled,
    'aria-label': ariaLabel,
    className: classes,
    disabled,
    onClick: !disabled ? handleClick : undefined,
    onMouseEnter: tooltip ? () => setShowTooltip(true) : undefined,
    onMouseLeave: tooltip ? () => setShowTooltip(false) : undefined,
    rel: newTab ? 'noopener noreferrer' : undefined,
    target: newTab ? '_blank' : undefined,
  }

  let buttonElement

  switch (el) {
    case 'link':
      if (!Link) {
        console.error('Link is required when using el="link"', children)
        return null
      }

      buttonElement = (
        <Link {...buttonProps} href={to || url} to={to || url}>
          <ButtonContents icon={icon} showTooltip={showTooltip} tooltip={tooltip}>
            {children}
          </ButtonContents>
        </Link>
      )
      break

    case 'anchor':
      buttonElement = (
        <a {...buttonProps} href={url} ref={ref as React.Ref<HTMLAnchorElement>}>
          <ButtonContents icon={icon} showTooltip={showTooltip} tooltip={tooltip}>
            {children}
          </ButtonContents>
        </a>
      )
      break

    default:
      const Tag = el // eslint-disable-line no-case-declarations

      buttonElement = (
        <Tag ref={ref} type="submit" {...buttonProps}>
          <ButtonContents icon={icon} showTooltip={showTooltip} tooltip={tooltip}>
            {children}
          </ButtonContents>
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
