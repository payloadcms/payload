'use client'
import type { LinkAdapterProps } from 'payload'

import * as React from 'react'

import { CheckIcon } from '../../../icons/Check/index.js'
import { Link } from '../../Link/index.js'
import './index.css'

const baseClass = 'popup-button-list'

const Group: React.FC<{
  children: React.ReactNode
  className?: string
  role?: 'group'
}> = ({ children, className, role }) => (
  <div className={className} role={role}>
    {children}
  </div>
)

export { PopupListDivider as Divider } from '../PopupDivider/index.js'
export { PopupListGroupLabel as GroupLabel } from '../PopupGroupLabel/index.js'

export const ButtonGroup: React.FC<{
  buttonSize?: 'default' | 'medium'
  children: React.ReactNode
  className?: string
  textAlign?: 'center' | 'left' | 'right'
}> = ({ buttonSize = 'default', children, className, textAlign = 'left' }) => {
  const classes = [
    baseClass,
    className,
    `${baseClass}__text-align--${textAlign}`,
    `${baseClass}__button-size--${buttonSize}`,
  ]
    .filter(Boolean)
    .join(' ')
  return <Group className={classes}>{children}</Group>
}

/**
 * A ButtonGroup variant for action menu items.
 * @param size - 'large' for 24px icons (default), 'small' for 16px icons
 */
export const MenuItem: React.FC<{
  children: React.ReactNode
  className?: string
  size?: 'large' | 'small'
}> = ({ children, className, size = 'large' }) => {
  const classes = [
    baseClass,
    className,
    `${baseClass}--with-actions`,
    size === 'large' && `${baseClass}--large`,
  ]
    .filter(Boolean)
    .join(' ')
  return <Group className={classes}>{children}</Group>
}

/**
 * A ButtonGroup variant for radio-style selection items.
 * Uses 16px icons with padding on label - ideal for checkbox/selection rows.
 */
export const RadioGroup: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  const classes = [baseClass, className, `${baseClass}--with-icons`].filter(Boolean).join(' ')
  return (
    <Group className={classes} role="group">
      {children}
    </Group>
  )
}

export const CheckboxGroup = RadioGroup

type MenuButtonProps = {
  active?: boolean
  ariaChecked?: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  href?: LinkAdapterProps['href']
  icon?: React.ReactNode
  id?: string
  onClick?: (e?: React.MouseEvent) => void
  role?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio'
}

export const Button: React.FC<MenuButtonProps> = ({
  id,
  active,
  ariaChecked,
  children,
  className,
  disabled,
  href,
  icon,
  onClick,
  role,
}) => {
  const classes = [
    `${baseClass}__button`,
    disabled && `${baseClass}__disabled`,
    active && `${baseClass}__button--selected`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Always render icon element - CSS hides it outside RadioGroup/MenuItem
  const iconElement = <span className={`${baseClass}__icon`}>{icon}</span>

  if (!disabled) {
    if (href) {
      return (
        <Link
          aria-checked={ariaChecked}
          className={classes}
          href={href}
          id={id}
          onClick={(e) => {
            if (onClick) {
              onClick(e)
            }
          }}
          prefetch={false}
          role={role ?? 'menuitem'}
          tabIndex={-1}
        >
          {iconElement}
          <span className={`${baseClass}__label`}>{children}</span>
        </Link>
      )
    }

    if (onClick) {
      return (
        <button
          aria-checked={ariaChecked}
          className={classes}
          id={id}
          onClick={(e) => {
            if (onClick) {
              onClick(e)
            }
          }}
          role={role ?? 'menuitem'}
          tabIndex={-1}
          type="button"
        >
          {iconElement}
          <span className={`${baseClass}__label`}>{children}</span>
        </button>
      )
    }
  }

  return (
    <button
      aria-disabled="true"
      className={classes}
      data-popup-prevent-close
      id={id}
      onClick={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
        }
      }}
      role={role ?? 'menuitem'}
      tabIndex={-1}
      type="button"
    >
      {iconElement}
      <span className={`${baseClass}__label`}>{children}</span>
    </button>
  )
}

/**
 * A Button variant for use within RadioGroup.
 * Automatically shows a checkmark icon when active.
 */
export const RadioGroupItem: React.FC<Omit<MenuButtonProps, 'icon'>> = (props) => {
  return (
    <Button
      {...props}
      ariaChecked={Boolean(props.active)}
      className={[`${baseClass}__button--radio-group-item`, props.className]
        .filter(Boolean)
        .join(' ')}
      icon={props.active ? <CheckIcon size={16} /> : undefined}
      role="menuitemradio"
    />
  )
}

/** A Button variant for independently selectable items within CheckboxGroup. */
export const CheckboxGroupItem: React.FC<Omit<MenuButtonProps, 'icon'>> = (props) => {
  return (
    <Button
      {...props}
      ariaChecked={Boolean(props.active)}
      className={[`${baseClass}__button--radio-group-item`, props.className]
        .filter(Boolean)
        .join(' ')}
      icon={props.active ? <CheckIcon size={16} /> : undefined}
      role="menuitemcheckbox"
    />
  )
}
