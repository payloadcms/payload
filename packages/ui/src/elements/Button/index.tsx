'use client'
import React, { Fragment } from 'react'

import type { Props } from './types.js'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { EditIcon } from '../../icons/Edit/index.js'
import { LinkIcon } from '../../icons/Link/index.js'
import { PlusIcon } from '../../icons/Plus/index.js'
import { SpinnerIcon } from '../../icons/Spinner/index.js'
import { SwapIcon } from '../../icons/Swap/index.js'
import { XIcon } from '../../icons/X/index.js'
import { Link } from '../Link/index.js'
import { Popup } from '../Popup/index.js'
import './index.css'
import { Tooltip } from '../Tooltip/index.js'

const icons = {
  chevron: ChevronIcon,
  edit: EditIcon,
  link: LinkIcon,
  plus: PlusIcon,
  swap: SwapIcon,
  x: XIcon,
}

const baseClass = 'btn'

export const ButtonContents = ({ children, icon, loading, showTooltip, tooltip }) => {
  const BuiltInIcon = typeof icon === 'string' ? icons[icon] : undefined
  // Check if icon is a React element (including RSC payloads) - not a string icon name
  const isReactIcon = icon && typeof icon !== 'string'

  return (
    <Fragment>
      {tooltip && (
        <Tooltip className={`${baseClass}__tooltip`} show={showTooltip}>
          {tooltip}
        </Tooltip>
      )}
      {loading && (
        <span className={`${baseClass}__loading`}>
          <SpinnerIcon />
        </span>
      )}
      <span className={`${baseClass}__content`}>
        {children && <span className={`${baseClass}__label`}>{children}</span>}
        {icon && (
          <span className={`${baseClass}__icon`}>
            {isReactIcon && icon}
            {BuiltInIcon && <BuiltInIcon size={24} />}
          </span>
        )}
      </span>
    </Fragment>
  )
}

export const Button: React.FC<Props> = (props) => {
  const {
    id,
    type = 'button',
    'aria-label': ariaLabel,
    buttonStyle = 'primary',
    children,
    className,
    disabled,
    el = 'button',
    enableSubMenu,
    extraButtonProps = {},
    icon,
    iconPosition = 'right',
    loading,
    margin = true,
    newTab,
    onClick,
    onMouseDown,
    popupIconSize,
    ref,
    round,
    selected,
    size = 'medium',
    SubMenuPopupContent,
    to,
    tooltip,
    url,
  } = props

  const [showTooltip, setShowTooltip] = React.useState(false)

  // Explicit `=== true` check preserves `false` for aria-disabled attribute.
  // Using `disabled || loading` would treat `false` as falsy, omitting the attribute entirely.
  const isDisabled = disabled === true || loading === true

  const classes = [
    baseClass,
    className && className,
    icon && `${baseClass}--icon`,
    icon && !children && `${baseClass}--icon-only`,
    size && `${baseClass}--size-${size}`,
    icon && iconPosition && `${baseClass}--icon-position-${iconPosition}`,
    tooltip && `${baseClass}--has-tooltip`,
    !SubMenuPopupContent && `${baseClass}--withoutPopup`,
    !margin && `${baseClass}--no-margin`,
    loading && `${baseClass}--loading`,
    icon && !children && `${baseClass}--icon-only`,
  ]
    .filter(Boolean)
    .join(' ')

  function handleClick(event) {
    setShowTooltip(false)
    if (type !== 'submit' && onClick) {
      event.preventDefault()
    }
    if (onClick) {
      onClick(event)
    }
  }

  const styleClasses = [
    buttonStyle && `${baseClass}--style-${buttonStyle}`,
    isDisabled && `${baseClass}--disabled`,
    round && `${baseClass}--round`,
    selected && `${baseClass}--selected`,
    SubMenuPopupContent ? `${baseClass}--withPopup` : `${baseClass}--withoutPopup`,
  ]
    .filter(Boolean)
    .join(' ')

  const buttonProps = {
    id,
    type,
    'aria-disabled': isDisabled,
    'aria-label': ariaLabel,
    className: !SubMenuPopupContent ? [classes, styleClasses].join(' ') : classes,
    disabled: isDisabled,
    onClick: !isDisabled ? handleClick : undefined,
    onMouseDown: !isDisabled ? onMouseDown : undefined,
    onPointerEnter: tooltip ? () => setShowTooltip(true) : undefined,
    onPointerLeave: tooltip ? () => setShowTooltip(false) : undefined,
    rel: newTab ? 'noopener noreferrer' : undefined,
    target: newTab ? '_blank' : undefined,
    title: tooltip ? undefined : ariaLabel,
    ...extraButtonProps,
  }

  let buttonElement

  switch (el) {
    case 'anchor':
      buttonElement = (
        <a
          {...buttonProps}
          href={!isDisabled ? url : undefined}
          ref={ref as React.RefObject<HTMLAnchorElement>}
        >
          <ButtonContents icon={icon} loading={loading} showTooltip={showTooltip} tooltip={tooltip}>
            {children}
          </ButtonContents>
        </a>
      )
      break

    case 'link':
      buttonElement = isDisabled ? (
        <div {...buttonProps}>
          <ButtonContents icon={icon} loading={loading} showTooltip={showTooltip} tooltip={tooltip}>
            {children}
          </ButtonContents>
        </div>
      ) : (
        <Link {...buttonProps} href={to || url} prefetch={false}>
          <ButtonContents icon={icon} loading={loading} showTooltip={showTooltip} tooltip={tooltip}>
            {children}
          </ButtonContents>
        </Link>
      )

      break

    default:
      const Tag = el // eslint-disable-line no-case-declarations

      buttonElement = (
        <Tag ref={ref} {...buttonProps}>
          <ButtonContents icon={icon} loading={loading} showTooltip={showTooltip} tooltip={tooltip}>
            {children}
          </ButtonContents>
        </Tag>
      )
      break
  }
  if (SubMenuPopupContent) {
    return (
      <div className={styleClasses}>
        {buttonElement}
        <Popup
          button={<ChevronIcon size={popupIconSize} />}
          buttonSize={size}
          className={disabled && !enableSubMenu ? `${baseClass}--popup-disabled` : ''}
          disabled={disabled && !enableSubMenu}
          horizontalAlign="right"
          id={`${id}-popup`}
          noBackground
          render={({ close }) => SubMenuPopupContent({ close: () => close() })}
          size="small"
          verticalAlign="bottom"
        />
      </div>
    )
  }

  return buttonElement
}
