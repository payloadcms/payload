import type { ElementType, MouseEvent } from 'react'
import type React from 'react'

type secondaryAction = {
  label: string
  onClick: (event: MouseEvent) => void
}

export type Props = {
  'aria-label'?: string
  buttonId?: string
  buttonStyle?: 'dashed' | 'destructive' | 'ghost' | 'pill' | 'primary' | 'secondary'
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  el?: 'anchor' | 'link' | ElementType
  /**
   * Setting to `true` will allow the submenu to be opened when the button is disabled
   */
  enableSubMenu?: boolean
  extraButtonProps?: Record<string, any>
  icon?: ['chevron' | 'edit' | 'plus' | 'x'] | React.ReactNode
  iconPosition?: 'left' | 'right'
  id?: string
  /**
   * @deprecated
   * This prop is deprecated and will be removed in the next major version.
   * Components now import their own `Link` directly from `next/link`.
   */
  Link?: React.ElementType
  /**
   * Shows a loading spinner and hides content. Disables interactions.
   */
  loading?: boolean
  margin?: boolean
  newTab?: boolean
  onClick?: (event: MouseEvent) => void
  onMouseDown?: (event: MouseEvent) => void
  /**
   * Size of the chevron icon in the split-button popup trigger.
   * @default 24
   */
  popupIconSize?: 16 | 24
  /**
   * Enables form submission via an onClick handler. This is only needed if
   * type="submit" does not trigger form submission, e.g. if the button DOM
   * element is not a direct child of the form element.
   *
   * @default false
   */
  programmaticSubmit?: boolean
  ref?: React.RefObject<HTMLAnchorElement | HTMLButtonElement | null>
  round?: boolean
  secondaryActions?: secondaryAction | secondaryAction[]
  size?: 'large' | 'medium'
  SubMenuPopupContent?: (props: { close: () => void }) => React.ReactNode
  to?: string
  tooltip?: string
  type?: 'button' | 'submit'
  url?: string
}
