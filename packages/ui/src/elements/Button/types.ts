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
   * Shows a loading spinner and hides content. Disables interactions.
   */
  loading?: boolean
  margin?: boolean
  newTab?: boolean
  onClick?: (event: MouseEvent) => void
  onMouseDown?: (event: MouseEvent) => void
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
  /**
   * Applies selected/active styling (e.g., for popup triggers when popup is open)
   */
  selected?: boolean
  size?: 'large' | 'medium'
  SubMenuPopupContent?: (props: { close: () => void }) => React.ReactNode
  to?: string
  tooltip?: string
  type?: 'button' | 'submit'
  url?: string
}
