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
export { SubmenuTrigger } from './SubmenuTrigger/index.js'

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
  ariaCurrent?: React.AriaAttributes['aria-current']
  children: React.ReactNode
  className?: string
  /**
   * Keeps the item focusable, but suppresses event callbacks, activation and popup dismissal.
   * Native `aria-disabled={true}` or `aria-disabled="true"` has the same effect.
   * Disabled href items render as buttons without a destination.
   */
  disabled?: boolean
  /**
   * Navigation for href items. `anchor` uses normal browser navigation without router providers.
   * @default 'link'
   */
  el?: 'anchor' | 'link'
  href?: LinkAdapterProps['href']
  icon?: React.ReactNode
  id?: string
  onClick?: (e?: React.MouseEvent) => void
  role?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio'
} & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement | HTMLButtonElement>,
  'href' | 'onClick' | 'role' | 'tabIndex' | 'type'
>

export const Button: React.FC<MenuButtonProps> = ({
  id,
  active,
  ariaChecked,
  ariaCurrent,
  children,
  className,
  disabled,
  el = 'link',
  href,
  icon,
  onClick,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  role,
  ...rest
}) => {
  const isDisabled =
    disabled ||
    rest['aria-disabled'] === true ||
    rest['aria-disabled'] === 'true' ||
    (!href && !onClick)

  const classes = [
    `${baseClass}__button`,
    isDisabled && `${baseClass}__disabled`,
    active && `${baseClass}__button--selected`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // ARIA-disabled items remain focusable and emit native events, including capture events.
  const nativeProps = isDisabled
    ? Object.fromEntries(Object.entries(rest).filter(([name]) => !name.startsWith('on')))
    : rest

  const itemProps = {
    ...nativeProps,
    id,
    'aria-checked': ariaChecked ?? rest['aria-checked'],
    'aria-current': ariaCurrent ?? rest['aria-current'],
    'aria-disabled': isDisabled || undefined,
    className: classes,
    onClick: (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault()
        return
      }

      onClick?.(event)
    },
    onKeyDown: isDisabled
      ? (event: React.KeyboardEvent<HTMLAnchorElement | HTMLButtonElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
          }
        }
      : onKeyDown,
    onMouseEnter: isDisabled ? undefined : onMouseEnter,
    onMouseLeave: isDisabled ? undefined : onMouseLeave,
    role: role ?? 'menuitem',
    tabIndex: -1,
  }

  const content = (
    <>
      <span className={`${baseClass}__icon`}>{icon}</span>
      <span className={`${baseClass}__label`}>{children}</span>
    </>
  )

  if (href && !isDisabled) {
    const LinkElement = el === 'anchor' ? 'a' : Link

    return (
      <LinkElement {...itemProps} {...(el === 'link' ? { prefetch: false } : {})} href={href}>
        {content}
      </LinkElement>
    )
  }

  return (
    <button
      {...itemProps}
      {...(isDisabled ? { 'data-popup-prevent-close': true } : {})}
      type="button"
    >
      {content}
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
